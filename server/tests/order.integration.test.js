// ============================================================
// Tests d'INTEGRATION : font tourner le VRAI code des repositories contre une
// VRAIE base MySQL (transactions, FOR UPDATE, triggers, contraintes).
//
// Activation : definir les variables TEST_DB_* (sinon les tests sont IGNORES,
// pour ne jamais toucher la base de dev par accident et garder `npm test` vert).
//   TEST_DB_HOST TEST_DB_PORT TEST_DB_USER TEST_DB_PASSWORD TEST_DB_NAME
//
// Couvre les priorites demandees : commandes + stock + idempotence paiement.
// ============================================================
import { test, before, after, beforeEach } from "node:test"
import assert from "node:assert/strict"

const ENABLED = !!process.env.TEST_DB_NAME
const skip = ENABLED ? false : "TEST_DB_NAME non defini — test d'integration ignore"

// On fait pointer le pool des repositories vers la base de TEST (avant tout
// import de core/database.js, qui lit ces variables a son chargement).
if (ENABLED) {
    process.env.DB_HOST = process.env.TEST_DB_HOST || process.env.DB_HOST || "localhost"
    process.env.DB_PORT = process.env.TEST_DB_PORT || process.env.DB_PORT || "3306"
    process.env.DB_USER = process.env.TEST_DB_USER || process.env.DB_USER
    process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD ?? process.env.DB_PASSWORD
    process.env.DB_NAME = process.env.TEST_DB_NAME
}

// Marqueurs uniques pour ne pas entrer en collision avec les donnees reelles.
const CAT = "__ITEST_CATEGORY__"
const PRODUCT = "__ITEST_PRODUIT__"
const USERNAME = "__itest_user__"
const EMAIL = "__itest__@test.local"

let db
let orderRepo
const fx = {}

before(async () => {
    if (!ENABLED) return
    db = (await import("../src/core/database.js")).db
    orderRepo = (await import("../src/repository/OrderRepository.js")).orderRepository

    // Nettoyage d'eventuels restes d'un run precedent (ordre FK : users d'abord
    // -> cascade orders/order_items/cart_items, puis products, puis categories).
    await db.query("DELETE FROM users WHERE email = ?", [EMAIL])
    await db.query("DELETE FROM products WHERE name = ?", [PRODUCT])
    await db.query("DELETE FROM categories WHERE name = ?", [CAT])

    const [cat] = await db.query("INSERT INTO categories (name, description) VALUES (?, 'integration test')", [CAT])
    fx.categoryId = cat.insertId
    const [prod] = await db.query(
        "INSERT INTO products (name, description, price, stock, category_id) VALUES (?, 'Produit de test integration', 5.00, 10, ?)",
        [PRODUCT, fx.categoryId]
    )
    fx.productId = prod.insertId
    const [usr] = await db.query(
        "INSERT INTO users (username, email, password, role) VALUES (?, ?, '$2b$12$integrationtestplaceholderhashxxxxxxxxxxxxxx', 'client')",
        [USERNAME, EMAIL]
    )
    fx.userId = usr.insertId
})

// Etat propre avant chaque test : stock=10, panier vide, commandes du user purgees.
beforeEach(async () => {
    if (!ENABLED) return
    await db.query("DELETE FROM orders WHERE user_id = ?", [fx.userId]) // cascade order_items
    await db.query("DELETE FROM cart_items WHERE user_id = ?", [fx.userId])
    await db.query("UPDATE products SET stock = 10 WHERE id = ?", [fx.productId])
})

after(async () => {
    if (!ENABLED || !db) return
    await db.query("DELETE FROM users WHERE id = ?", [fx.userId])
    await db.query("DELETE FROM products WHERE id = ?", [fx.productId])
    await db.query("DELETE FROM categories WHERE id = ?", [fx.categoryId])
    await db.end()
})

const addToCart = (qty) =>
    db.query("INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)", [fx.userId, fx.productId, qty])

test("createPendingFromCart : decremente le stock, calcule le total, CONSERVE le panier", { skip }, async () => {
    await addToCart(3)

    const res = await orderRepo.createPendingFromCart(fx.userId, "12 rue de Test, 75001 Paris", null)
    assert.ok(res.orderId, "un orderId doit etre retourne")

    const [[product]] = await db.query("SELECT stock FROM products WHERE id = ?", [fx.productId])
    assert.equal(product.stock, 7, "stock = 10 - 3")

    const [cart] = await db.query("SELECT id FROM cart_items WHERE user_id = ?", [fx.userId])
    assert.equal(cart.length, 1, "le panier est CONSERVE jusqu'au paiement (vide seulement a markPaid)")

    const [[order]] = await db.query("SELECT status, subtotal, total FROM orders WHERE id = ?", [res.orderId])
    assert.equal(order.status, "en_attente")
    assert.equal(Number(order.subtotal), 15, "3 x 5.00")
    assert.equal(Number(order.total), 15)
})

test("createPendingFromCart : stock insuffisant -> rejet, stock inchange (rollback)", { skip }, async () => {
    await addToCart(999)

    await assert.rejects(
        () => orderRepo.createPendingFromCart(fx.userId, "12 rue de Test, 75001 Paris", null),
        /Stock insuffisant/
    )

    const [[product]] = await db.query("SELECT stock FROM products WHERE id = ?", [fx.productId])
    assert.equal(product.stock, 10, "le stock ne doit PAS avoir bouge (transaction annulee)")
})

test("createPendingFromCart : livraison gratuite refusee sous 50 EUR, acceptee au seuil", { skip }, async () => {
    const [[freeMethod]] = await db.query("SELECT id FROM shipping_methods WHERE price = 0 LIMIT 1")
    assert.ok(freeMethod, "une methode de livraison gratuite (prix 0) existe dans le seed")

    // 2 x 5.00 = 10 EUR < 50 -> la livraison gratuite doit etre REFUSEE
    await addToCart(2)
    await assert.rejects(
        () => orderRepo.createPendingFromCart(fx.userId, "12 rue de Test, 75001 Paris", freeMethod.id),
        /livraison gratuite/i
    )
    const [[p]] = await db.query("SELECT stock FROM products WHERE id = ?", [fx.productId])
    assert.equal(p.stock, 10, "stock inchange apres refus (rollback)")

    // 10 x 5.00 = 50 EUR >= 50 -> livraison gratuite ACCEPTEE
    await db.query("DELETE FROM cart_items WHERE user_id = ?", [fx.userId])
    await addToCart(10)
    const res = await orderRepo.createPendingFromCart(fx.userId, "12 rue de Test, 75001 Paris", freeMethod.id)
    assert.ok(res.orderId, "au seuil de 50 EUR la livraison gratuite est acceptee")
    const [[order]] = await db.query("SELECT shipping_cost, total FROM orders WHERE id = ?", [res.orderId])
    assert.equal(Number(order.shipping_cost), 0, "livraison gratuite = 0 EUR")
    assert.equal(Number(order.total), 50, "total = 50 (sous-total, livraison offerte)")
})

test("markPaid : transition atomique exactly-once + vide le panier au paiement", { skip }, async () => {
    await addToCart(2)
    const { orderId } = await orderRepo.createPendingFromCart(fx.userId, "12 rue de Test, 75001 Paris", null)

    const [beforePay] = await db.query("SELECT id FROM cart_items WHERE user_id = ?", [fx.userId])
    assert.equal(beforePay.length, 1, "panier CONSERVE avant paiement")

    const first = await orderRepo.markPaid(orderId, "pi_test_123")
    const second = await orderRepo.markPaid(orderId, "pi_test_123")

    assert.ok(first, "le 1er appel gagne et renvoie la commande")
    assert.equal(second, null, "le 2e appel concurrent ne renvoie rien (pas de 2e email)")

    const [[order]] = await db.query("SELECT status, stripe_payment_id FROM orders WHERE id = ?", [orderId])
    assert.equal(order.status, "payee")
    assert.equal(order.stripe_payment_id, "pi_test_123")

    const [afterPay] = await db.query("SELECT id FROM cart_items WHERE user_id = ?", [fx.userId])
    assert.equal(afterPay.length, 0, "panier VIDE apres paiement confirme")
})

test("claimConfirmationEmail : verrou idempotent, libere -> re-claimable, exige status 'payee'", { skip }, async () => {
    await orderRepo.ensureColumns() // garantit la colonne confirmation_email_sent
    await addToCart(1)
    const { orderId } = await orderRepo.createPendingFromCart(fx.userId, "12 rue de Test, 75001 Paris", null)

    // Avant paiement : commande 'en_attente' -> claim refuse (pas d'email premature).
    assert.equal(await orderRepo.claimConfirmationEmail(orderId), false, "pas de claim tant que non payee")

    await orderRepo.markPaid(orderId, "pi_test_mail")

    // 1er claim gagne, 2e refuse -> un seul email meme si webhook + /success se croisent.
    assert.equal(await orderRepo.claimConfirmationEmail(orderId), true, "1er claim gagne")
    assert.equal(await orderRepo.claimConfirmationEmail(orderId), false, "2e claim refuse (deja envoye)")

    // Liberation (simulant un echec d'envoi SMTP) -> re-claimable pour retry.
    await orderRepo.releaseConfirmationEmail(orderId)
    assert.equal(await orderRepo.claimConfirmationEmail(orderId), true, "re-claim possible apres liberation")
})

test("cancelPendingAndRestoreStock : restaure le stock, idempotent", { skip }, async () => {
    await addToCart(4)
    const { orderId } = await orderRepo.createPendingFromCart(fx.userId, "12 rue de Test, 75001 Paris", null)

    const [[afterOrder]] = await db.query("SELECT stock FROM products WHERE id = ?", [fx.productId])
    assert.equal(afterOrder.stock, 6, "stock = 10 - 4")

    const cancelled = await orderRepo.cancelPendingAndRestoreStock(orderId, "test")
    assert.equal(cancelled, true)

    const [[afterCancel]] = await db.query("SELECT stock FROM products WHERE id = ?", [fx.productId])
    assert.equal(afterCancel.stock, 10, "stock restaure")

    const again = await orderRepo.cancelPendingAndRestoreStock(orderId, "test")
    assert.equal(again, false, "2e annulation = no-op (idempotent)")

    const [[order]] = await db.query("SELECT status FROM orders WHERE id = ?", [orderId])
    assert.equal(order.status, "annulee")
})

test("findByPaymentIntent : resout la commande via stripe_payment_id", { skip }, async () => {
    await addToCart(1)
    const { orderId } = await orderRepo.createPendingFromCart(fx.userId, "12 rue de Test, 75001 Paris", null)
    await orderRepo.markPaid(orderId, "pi_lookup_test")

    const found = await orderRepo.findByPaymentIntent("pi_lookup_test")
    assert.ok(found, "commande trouvee via payment_intent")
    assert.equal(found.id, orderId)
    assert.equal(await orderRepo.findByPaymentIntent("pi_inexistant"), null, "pi inconnu -> null")
})

test("refundAndRestoreStock : remboursement total d'une commande 'payee' restaure le stock, idempotent", { skip }, async () => {
    await orderRepo.ensureColumns()
    await addToCart(3)
    const { orderId } = await orderRepo.createPendingFromCart(fx.userId, "12 rue de Test, 75001 Paris", null)
    await orderRepo.markPaid(orderId, "pi_refund_test")

    const [[afterPay]] = await db.query("SELECT stock FROM products WHERE id = ?", [fx.productId])
    assert.equal(afterPay.stock, 7, "stock = 10 - 3 apres paiement")

    const refunded = await orderRepo.refundAndRestoreStock(orderId, "test")
    assert.equal(refunded, true)

    const [[afterRefund]] = await db.query("SELECT stock FROM products WHERE id = ?", [fx.productId])
    assert.equal(afterRefund.stock, 10, "stock restaure (commande payee non expediee)")
    const [[order]] = await db.query("SELECT status FROM orders WHERE id = ?", [orderId])
    assert.equal(order.status, "remboursee")

    const again = await orderRepo.refundAndRestoreStock(orderId, "test")
    assert.equal(again, false, "2e remboursement = no-op (idempotent)")
    const [[afterTwice]] = await db.query("SELECT stock FROM products WHERE id = ?", [fx.productId])
    assert.equal(afterTwice.stock, 10, "stock inchange apres 2e appel")
})

test("refundAndRestoreStock : commande 'expediee' remboursee -> statut remboursee SANS restaurer le stock", { skip }, async () => {
    await orderRepo.ensureColumns()
    await addToCart(2)
    const { orderId } = await orderRepo.createPendingFromCart(fx.userId, "12 rue de Test, 75001 Paris", null)
    await orderRepo.markPaid(orderId, "pi_refund_ship")
    await db.query("UPDATE orders SET status = 'expediee' WHERE id = ?", [orderId]) // pas de trigger sur orders

    const [[afterShip]] = await db.query("SELECT stock FROM products WHERE id = ?", [fx.productId])
    assert.equal(afterShip.stock, 8, "stock = 10 - 2")

    const refunded = await orderRepo.refundAndRestoreStock(orderId, "test")
    assert.equal(refunded, true)

    const [[afterRefund]] = await db.query("SELECT stock FROM products WHERE id = ?", [fx.productId])
    assert.equal(afterRefund.stock, 8, "stock INCHANGE (marchandise deja expediee)")
    const [[order]] = await db.query("SELECT status FROM orders WHERE id = ?", [orderId])
    assert.equal(order.status, "remboursee")
})

test("createPendingFromCart : un 2e checkout annule la commande en_attente precedente (pas de reservation double)", { skip }, async () => {
    await addToCart(3)

    const first = await orderRepo.createPendingFromCart(fx.userId, "12 rue de Test, 75001 Paris", null)
    const [[afterFirst]] = await db.query("SELECT stock FROM products WHERE id = ?", [fx.productId])
    assert.equal(afterFirst.stock, 7, "stock = 10 - 3 (1re reservation)")

    // Panier toujours plein -> 2e checkout : annule/restaure la 1re puis re-reserve.
    // Le stock NET ne bouge pas : pas de double reservation.
    const second = await orderRepo.createPendingFromCart(fx.userId, "12 rue de Test, 75001 Paris", null)
    const [[afterSecond]] = await db.query("SELECT stock FROM products WHERE id = ?", [fx.productId])
    assert.equal(afterSecond.stock, 7, "stock TOUJOURS 7 (1re annulee/restauree, 2e reservee)")

    const [[order1]] = await db.query("SELECT status FROM orders WHERE id = ?", [first.orderId])
    assert.equal(order1.status, "annulee", "la 1re commande en_attente est annulee")
    const [[order2]] = await db.query("SELECT status FROM orders WHERE id = ?", [second.orderId])
    assert.equal(order2.status, "en_attente", "la 2e commande reste en attente")

    // Le panier est conserve (vide seulement au paiement).
    const [cart] = await db.query("SELECT id FROM cart_items WHERE user_id = ?", [fx.userId])
    assert.equal(cart.length, 1, "panier conserve apres re-checkout")
})
