import {Repository} from "../core/Repository.js";
import {db, withTransaction} from "../core/database.js";
import {Order} from "../entity/Order.js";
import {ValidationException} from "../error/HttpException.js";
import {Logger} from "../services/Logger.js";
import {computeOrderTotals} from "../services/OrderPricing.js";

class OrderRepository extends Repository {

    constructor() {
        super(Order, "orders");
    }

    findByUser = async (userId) => {
        const [rows] = await db.query(
            `SELECT id, subtotal, shipping_cost, total, status, shipping_address, created_at
             FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
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
    //   - verrouillage des lignes produits (FOR UPDATE, anti race condition TOCTOU)
    //   - verification des stocks
    //   - insertion commande + articles, decrement du stock, vidage du panier
    createPendingFromCart = async (userId, shippingAddress, shippingMethodId) =>
        withTransaction(async (connection) => {
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

            // Calcul des montants delegue a une fonction pure (testable + arrondi
            // centimes coherent). Cf. services/OrderPricing.js.
            const { subtotal, total } = computeOrderTotals(cartItems, shippingCost)

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

            await connection.query("DELETE FROM cart_items WHERE user_id = ?", [userId])

            return { orderId, cartItems, subtotal, shippingCost, shippingName, total }
        })

    // Idempotent ET atomique : la transition 'en_attente' -> 'payee' est faite
    // dans UNE seule requete avec la garde `AND status = 'en_attente'`. La 1re
    // requete qui passe "gagne" (affectedRows === 1) ; toute execution
    // concurrente (le webhook Stripe ET le retour /payments/success arrivent
    // souvent en parallele) verra affectedRows === 0 et renverra null.
    // -> garantit l'envoi d'UN SEUL email de confirmation (exactly-once).
    // Avant : SELECT puis UPDATE separes laissaient une fenetre de course ou
    // deux appels lisaient 'en_attente' avant que l'un n'ecrive -> double email.
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
        return orders.length === 0 ? null : orders[0]
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

    revenueByDay = async () => {
        const [rows] = await db.query(
            `SELECT DATE(created_at) AS date,
                    SUM(total)       AS revenue
               FROM orders
              WHERE status IN ('payee','en_preparation','expediee','livree')
                AND created_at >= NOW() - INTERVAL 30 DAY
              GROUP BY DATE(created_at)
              ORDER BY date ASC`
        )
        return rows
    }
}

export const orderRepository = new OrderRepository()
