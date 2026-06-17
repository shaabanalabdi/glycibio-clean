import {Repository} from "../core/Repository.js";
import {db, withTransaction} from "../core/database.js";
import {Order} from "../entity/Order.js";
import {ValidationException} from "../error/HttpException.js";
import {Logger} from "../services/Logger.js";
import {computeOrderTotals, FREE_SHIPPING_THRESHOLD} from "../services/OrderPricing.js";

class OrderRepository extends Repository {

    constructor() {
        super(Order, "orders");
    }

    // Schema ajoute par migration : applique au demarrage s'il manque (meme
    // patron que UserRepository.ensureColumns, compatible MySQL 5.7+ et 8.x).
    // Memoise : l'introspection INFORMATION_SCHEMA ne tourne qu'une seule fois.
    ensureColumns = (() => {
        let promise = null
        const REQUIRED = [
            { name: "confirmation_email_sent", ddl: "TINYINT(1) NOT NULL DEFAULT 0" }
        ]
        // Valeur ENUM ajoutee a orders.status (remboursement Stripe).
        const STATUS_ENUM = "ENUM('en_attente','payee','en_preparation','expediee','livree','annulee','remboursee') NOT NULL DEFAULT 'en_attente'"
        return () => {
            if (!promise) {
                promise = (async () => {
                    try
                    {
                        const [rows] = await db.query(
                            `SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
                              WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders'`
                        )
                        const present = new Map(rows.map((r) => [r.COLUMN_NAME, r.COLUMN_TYPE]))

                        for (const col of REQUIRED.filter((c) => !present.has(c.name))) {
                            try
                            {
                                await db.query(`ALTER TABLE orders ADD COLUMN ${col.name} ${col.ddl}`)
                                Logger.info(`[OrderRepository] Colonne ajoutee : orders.${col.name}`)
                            }
                            catch (e)
                            {
                                Logger.warn(`[OrderRepository] Echec ajout orders.${col.name}: ${e.message}`)
                            }
                        }

                        // Elargit l'ENUM status si la valeur 'remboursee' manque
                        // (sinon UPDATE ... SET status='remboursee' echouerait sur
                        // une BDD existante).
                        const statusType = present.get("status") || ""
                        if (!statusType.includes("remboursee")) {
                            try
                            {
                                await db.query(`ALTER TABLE orders MODIFY COLUMN status ${STATUS_ENUM}`)
                                Logger.info("[OrderRepository] ENUM orders.status elargi (+remboursee)")
                            }
                            catch (e)
                            {
                                Logger.warn(`[OrderRepository] Echec elargissement orders.status: ${e.message}`)
                            }
                        }
                    }
                    catch (e)
                    {
                        Logger.warn("[OrderRepository] ensureColumns:", e.message)
                    }
                })()
            }
            return promise
        }
    })()

    // Verrou d'idempotence atomique pour l'email de confirmation : un seul
    // appelant (webhook Stripe OU retour /payments/success) "gagne" la pose du
    // drapeau (affectedRows === 1) et envoie donc l'email. La garde status='payee'
    // empeche d'envoyer avant le paiement. En cas d'echec d'envoi, l'appelant
    // libere le verrou (releaseConfirmationEmail) -> une nouvelle tentative
    // (retry webhook) pourra renvoyer l'email (pas de perte sur panne SMTP).
    claimConfirmationEmail = async (orderId) => {
        const [result] = await db.query(
            "UPDATE orders SET confirmation_email_sent = 1 WHERE id = ? AND status = 'payee' AND confirmation_email_sent = 0",
            [orderId]
        )
        return result.affectedRows === 1
    }

    releaseConfirmationEmail = async (orderId) => {
        await db.query("UPDATE orders SET confirmation_email_sent = 0 WHERE id = ?", [orderId])
    }

    // "Mes commandes" : on n'affiche QUE les commandes reellement payees (et leurs
    // etats ulterieurs : preparation/expediee/livree/remboursee). Les commandes
    // 'en_attente' (tunnel de paiement non finalise) et 'annulee' sont des
    // artefacts de panier/checkout abandonne et ne doivent pas polluer l'historique.
    findByUser = async (userId) => {
        const [rows] = await db.query(
            `SELECT id, subtotal, shipping_cost, total, status, shipping_address, created_at
             FROM orders
             WHERE user_id = ?
               AND status IN ('payee','en_preparation','expediee','livree','remboursee')
             ORDER BY created_at DESC`,
            [userId]
        )
        return rows
    }

    findByIdForUser = async (id, userId) => {
        const [rows] = await db.query("SELECT * FROM orders WHERE id = ? AND user_id = ?", [id, userId])
        return rows.length === 0 ? null : rows[0]
    }

    findAllWithCustomer = async () => {
        const [rows] = await db.query(
            `SELECT o.*, u.email,
                    COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''), u.email) AS customer_name
             FROM orders o
             JOIN users u ON o.user_id = u.id
             ORDER BY o.created_at DESC`
        )
        return rows
    }

    updateStatus = async (id, status) => {
        const [result] = await db.query("UPDATE orders SET status = ? WHERE id = ?", [status, id])
        return result.affectedRows > 0
    }

    setStripeSession = async (id, sessionId) => {
        await db.query("UPDATE orders SET stripe_session_id = ? WHERE id = ?", [sessionId, id])
    }

    // Creation de commande depuis le panier, dans UNE transaction :
    //   - annulation des commandes "en_attente" precedentes (restaure leur stock)
    //     -> pas de reservation double si le client relance le paiement
    //   - verrouillage des lignes produits (FOR UPDATE, anti race condition TOCTOU)
    //   - verification des stocks + insertion commande/articles + decrement
    // Le panier N'EST PAS vide ici : il l'est seulement au PAIEMENT confirme
    // (markPaid) -> un checkout abandonne conserve donc le panier du client.
    createPendingFromCart = async (userId, shippingAddress, shippingMethodId) =>
        withTransaction(async (connection) => {
            // Annuler toute commande encore en attente de cet utilisateur et
            // restaurer son stock (re-checkout : evite la reservation en double
            // et l'accumulation de commandes fantomes).
            const [pendings] = await connection.query(
                "SELECT id FROM orders WHERE user_id = ? AND status = 'en_attente' FOR UPDATE",
                [userId]
            )
            for (const po of pendings) {
                const [poItems] = await connection.query(
                    "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
                    [po.id]
                )
                for (const it of poItems) {
                    await connection.query(
                        "UPDATE products SET stock = stock + ? WHERE id = ?",
                        [it.quantity, it.product_id]
                    )
                }
                await connection.query("UPDATE orders SET status = 'annulee' WHERE id = ?", [po.id])
            }

            const [cartItems] = await connection.query(
                `SELECT ci.product_id, ci.quantity, p.name, p.price, p.stock, p.image
                 FROM cart_items ci
                 JOIN products p ON ci.product_id = p.id
                 WHERE ci.user_id = ?
                 FOR UPDATE`,
                [userId]
            )

            if (cartItems.length === 0) {
                throw new ValidationException("Votre panier est vide")
            }

            for (const item of cartItems) {
                if (item.stock < item.quantity) {
                    throw new ValidationException(`Stock insuffisant pour "${item.name}". Disponible : ${item.stock}`)
                }
            }

            // Sous-total d'abord (sans livraison) : necessaire pour valider
            // l'eligibilite a la livraison gratuite avant de fixer le cout.
            const { subtotal } = computeOrderTotals(cartItems, 0)

            let shippingCost = 0
            let shippingName = "Livraison standard"
            if (shippingMethodId) {
                const [methods] = await connection.query(
                    "SELECT price, name FROM shipping_methods WHERE id = ? AND is_active = TRUE",
                    [shippingMethodId]
                )
                if (methods.length > 0) {
                    shippingCost = parseFloat(methods[0].price)
                    shippingName = methods[0].name
                }
            }

            // Regle metier : la livraison GRATUITE (cout 0) n'est autorisee qu'au-dela
            // d'un sous-total minimum. Verifie cote SERVEUR (le client est contournable).
            if (shippingMethodId && shippingCost === 0 && subtotal < FREE_SHIPPING_THRESHOLD) {
                throw new ValidationException(
                    `La livraison gratuite necessite un minimum de ${FREE_SHIPPING_THRESHOLD} EUR d'achat (sous-total : ${subtotal.toFixed(2)} EUR).`
                )
            }

            // Total final avec le cout de livraison retenu (fonction pure, arrondi centimes).
            const { total } = computeOrderTotals(cartItems, shippingCost)

            const [orderResult] = await connection.query(
                `INSERT INTO orders (user_id, shipping_address, shipping_method_id, shipping_cost, subtotal, total, status)
                 VALUES (?, ?, ?, ?, ?, ?, 'en_attente')`,
                [userId, shippingAddress, shippingMethodId || null, shippingCost, subtotal, total]
            )
            const orderId = orderResult.insertId

            for (const item of cartItems) {
                await connection.query(
                    "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)",
                    [orderId, item.product_id, item.quantity, item.price]
                )
                await connection.query(
                    "UPDATE products SET stock = stock - ? WHERE id = ?",
                    [item.quantity, item.product_id]
                )
            }

            // NB: le panier n'est PAS vide ici (cf. markPaid au paiement confirme).
            return { orderId, cartItems, subtotal, shippingCost, shippingName, total }
        })

    // Idempotent ET atomique : la transition 'en_attente' -> 'payee' est faite
    // dans UNE seule requete avec la garde `AND status = 'en_attente'`. La 1re
    // requete qui passe "gagne" (affectedRows === 1) ; toute execution
    // concurrente (le webhook Stripe ET le retour /payments/success arrivent
    // souvent en parallele) verra affectedRows === 0 et renverra null.
    // -> garantit un vidage de panier exactly-once. L'email de confirmation est
    //    decouple (cf. claimConfirmationEmail) pour survivre a une panne SMTP
    //    transitoire (retente sans doublon plutot que perdu).
    markPaid = async (orderId, paymentIntentId) => {
        const [result] = await db.query(
            "UPDATE orders SET status = 'payee', stripe_payment_id = ? WHERE id = ? AND status = 'en_attente'",
            [paymentIntentId || null, orderId]
        )

        // affectedRows === 0 : commande inexistante OU deja traitee par un appel
        // concurrent -> on NE renvoie PAS la commande, donc PAS de second email.
        if (result.affectedRows === 0) return null

        const [orders] = await db.query(
            "SELECT id, total, shipping_address, user_id, status FROM orders WHERE id = ?",
            [orderId]
        )
        if (orders.length === 0) return null

        // Paiement confirme -> on vide MAINTENANT le panier (et seulement
        // maintenant : un checkout abandonne conserve donc le panier du client).
        // Idempotent : seul l'appel gagnant (affectedRows === 1) arrive ici.
        await db.query("DELETE FROM cart_items WHERE user_id = ?", [orders[0].user_id])

        return orders[0]
    }

    // Annule une commande "en_attente" et restaure le stock des produits.
    // Idempotent : si la commande n'est plus en_attente, no-op silencieux.
    cancelPendingAndRestoreStock = async (orderId, reason = "unknown") => {
        try
        {
            const cancelled = await withTransaction(async (connection) => {
                const [orders] = await connection.query(
                    "SELECT id, status FROM orders WHERE id = ? FOR UPDATE",
                    [orderId]
                )

                if (orders.length === 0 || orders[0].status !== "en_attente") {
                    return false
                }

                const [items] = await connection.query(
                    "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
                    [orderId]
                )

                for (const item of items) {
                    await connection.query(
                        "UPDATE products SET stock = stock + ? WHERE id = ?",
                        [item.quantity, item.product_id]
                    )
                }

                await connection.query("UPDATE orders SET status = 'annulee' WHERE id = ?", [orderId])

                return true
            })

            if (cancelled) {
                Logger.info(`[OrderRepository] Commande #${orderId} annulee (${reason}) - stock restaure`)
            }
            return cancelled
        }
        catch (error)
        {
            Logger.error(`[OrderRepository] Erreur annulation #${orderId}:`, error.message)
            throw error
        }
    }

    // Resout une commande a partir de l'identifiant Stripe du PaymentIntent
    // (stocke dans stripe_payment_id par markPaid). Utilise par le webhook de
    // remboursement : l'objet `charge` ne porte pas metadata.order_id, mais bien
    // son payment_intent.
    findByPaymentIntent = async (paymentIntentId) => {
        if (!paymentIntentId) return null
        const [rows] = await db.query(
            "SELECT id, status FROM orders WHERE stripe_payment_id = ? LIMIT 1",
            [paymentIntentId]
        )
        return rows.length === 0 ? null : rows[0]
    }

    // Marque une commande remboursee (suite a un remboursement TOTAL Stripe).
    // Le stock n'est restaure QUE si la commande est encore 'payee' (pas encore
    // expediee) -> on ne re-credite pas du stock physiquement deja sorti pour une
    // commande expediee/livree. Idempotent : no-op si deja remboursee/annulee.
    // N'altere PAS order_items (les triggers de verrou l'interdisent sur une
    // commande validee) : la restauration passe par la table products.
    refundAndRestoreStock = async (orderId, reason = "charge.refunded") => {
        try
        {
            const refunded = await withTransaction(async (connection) => {
                const [orders] = await connection.query(
                    "SELECT id, status FROM orders WHERE id = ? FOR UPDATE",
                    [orderId]
                )

                if (orders.length === 0) return false
                const status = orders[0].status
                if (status === "remboursee" || status === "annulee") return false // idempotent

                // Restauration du stock uniquement si rien n'est encore expedie.
                if (status === "payee") {
                    const [items] = await connection.query(
                        "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
                        [orderId]
                    )
                    for (const item of items) {
                        await connection.query(
                            "UPDATE products SET stock = stock + ? WHERE id = ?",
                            [item.quantity, item.product_id]
                        )
                    }
                }

                await connection.query("UPDATE orders SET status = 'remboursee' WHERE id = ?", [orderId])
                return { stockRestored: status === "payee" }
            })

            if (refunded) {
                Logger.info(`[OrderRepository] Commande #${orderId} remboursee (${reason}) - stock restaure: ${refunded.stockRestored}`)
                return true
            }
            return false
        }
        catch (error)
        {
            Logger.error(`[OrderRepository] Erreur remboursement #${orderId}:`, error.message)
            throw error
        }
    }

    findByUserForExport = async (userId) => {
        const [rows] = await db.query(
            `SELECT id, status, subtotal, shipping_cost, total, shipping_address, created_at, updated_at
               FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
            [userId]
        )
        return rows
    }

    getDashboardKpi = async () => {
        const [rows] = await db.query("SELECT * FROM v_admin_dashboard")
        return rows[0]
    }

    findRecentWithCustomer = async () => {
        const [rows] = await db.query(
            `SELECT o.id, o.total, o.status, o.created_at, u.email,
                    COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''), u.email) AS customer_name
             FROM orders o
             JOIN users u ON o.user_id = u.id
             ORDER BY o.created_at DESC
             LIMIT 10`
        )
        return rows
    }

}

export const orderRepository = new OrderRepository()
