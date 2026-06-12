import {Repository} from "../core/Repository.js";
import {db} from "../core/database.js";
import {WishlistItem} from "../entity/WishlistItem.js";

class WishlistItemRepository extends Repository {

    constructor() {
        super(WishlistItem, "wishlist_items");
    }

    findByUserWithProducts = async (userId) => {
        const [rows] = await db.query(
            `SELECT w.id AS wishlist_item_id, w.created_at AS added_at,
                    p.id, p.slug, p.name, p.price, p.image, p.stock,
                    p.glycemic_index, p.ig_category, c.name AS category_name
               FROM wishlist_items w
               JOIN products p ON w.product_id = p.id
               LEFT JOIN categories c ON p.category_id = c.id
              WHERE w.user_id = ? AND p.is_active = TRUE
              ORDER BY w.created_at DESC`,
            [userId]
        )
        return rows
    }

    addItem = async (userId, productId) => {
        await db.query(
            `INSERT INTO wishlist_items (user_id, product_id) VALUES (?, ?)
             ON DUPLICATE KEY UPDATE created_at = created_at`,
            [userId, productId]
        )
    }

    removeByUserAndProduct = async (userId, productId) => {
        const [result] = await db.query(
            "DELETE FROM wishlist_items WHERE user_id = ? AND product_id = ?",
            [userId, productId]
        )
        return result.affectedRows > 0
    }

    findIdsByUser = async (userId) => {
        const [rows] = await db.query("SELECT product_id FROM wishlist_items WHERE user_id = ?", [userId])
        return rows.map((row) => row.product_id)
    }
}

export const wishlistItemRepository = new WishlistItemRepository()
