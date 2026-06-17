import {Repository} from "../core/Repository.js";
import {db} from "../core/database.js";
import {CartItem} from "../entity/CartItem.js";

class CartItemRepository extends Repository {

    constructor() {
        super(CartItem, "cart_items");
    }

    findByUserWithProducts = async (userId) => {
        const [rows] = await db.query(
            `SELECT
               ci.id, ci.quantity,
               p.id AS product_id, p.name, p.price, p.image,
               p.stock, p.glycemic_index, p.ig_category,
               (ci.quantity * p.price) AS subtotal
             FROM cart_items ci
             JOIN products p ON ci.product_id = p.id
             WHERE ci.user_id = ?
             ORDER BY ci.created_at DESC`,
            [userId]
        )
        return rows
    }

    findQuantity = async (userId, productId) => {
        const [rows] = await db.query(
            "SELECT quantity FROM cart_items WHERE user_id = ? AND product_id = ?",
            [userId, productId]
        )
        return rows.length === 0 ? 0 : rows[0].quantity
    }

    upsertItem = async (userId, productId, quantity) => {
        await db.query(
            `INSERT INTO cart_items (user_id, product_id, quantity)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
            [userId, productId, quantity]
        )
    }

    findItemWithStock = async (id, userId) => {
        const [rows] = await db.query(
            `SELECT ci.id, p.stock
             FROM cart_items ci
             JOIN products p ON ci.product_id = p.id
             WHERE ci.id = ? AND ci.user_id = ?`,
            [id, userId]
        )
        return rows.length === 0 ? null : rows[0]
    }

    // user_id dans le WHERE : défense en profondeur (le contrôleur vérifie déjà la
    // propriété via findItemWithStock, mais l'UPDATE est désormais lui-même scopé).
    updateQuantity = async (id, quantity, userId) => {
        await db.query("UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?", [quantity, id, userId])
    }

    removeItem = async (id, userId) => {
        const [result] = await db.query(
            "DELETE FROM cart_items WHERE id = ? AND user_id = ?",
            [id, userId]
        )
        return result.affectedRows > 0
    }

    clearForUser = async (userId) => {
        await db.query("DELETE FROM cart_items WHERE user_id = ?", [userId])
    }
}

export const cartItemRepository = new CartItemRepository()
