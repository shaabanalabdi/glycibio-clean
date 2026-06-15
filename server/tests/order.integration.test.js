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

test("createPendingFromCart : decremente le stock, calcule le total, vide le panier", { skip }, async () => {
    await addToCart(3)

    const res = await orderRepo.createPendingFromCart(fx.userId, "12 rue de Test, 75001 Paris", null)
    assert.ok(res.orderId, "un orderId doit etre retourne")

    const [[product]] = await db.query("SELECT stock FROM products WHERE id = ?", [fx.productId])
    assert.equal(product.stock, 7, "stock = 10 - 3")

    const [cart] = await db.query("SELECT id FROM cart_items WHERE user_id = ?", [fx.userId])
    assert.equal(cart.length, 0, "le panier doit etre vide")

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

test("markPaid : transition atomique exactly-once (anti double traitement)", { skip }, async () => {
    await addToCart(2)
    const { orderId } = await orderRepo.createPendingFromCart(fx.userId, "12 rue de Test, 75001 Paris", null)

    const first = await orderRepo.markPaid(orderId, "pi_test_123")
    const second = await orderRepo.markPaid(orderId, "pi_test_123")

    assert.ok(first, "le 1er appel gagne et renvoie la commande")
    assert.equal(second, null, "le 2e appel concurrent ne renvoie rien (pas de 2e email)")

    const [[order]] = await db.query("SELECT status, stripe_payment_id FROM orders WHERE id = ?", [orderId])
    assert.equal(order.status, "payee")
    assert.equal(order.stripe_payment_id, "pi_test_123")
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
