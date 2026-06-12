import {Repository} from "../core/Repository.js";
import {db} from "../core/database.js";
import {OrderItem} from "../entity/OrderItem.js";

class OrderItemRepository extends Repository {

    constructor() {
        super(OrderItem, "order_items");
    }

    findByOrderWithProducts = async (orderId) => {
        const [rows] = await db.query(
            `SELECT oi.*, p.name, p.image
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = ?`,
            [orderId]
        )
        return rows
    }

    // Eligibilite avis : l'utilisateur doit avoir commande ce produit
    // (commande payee ou plus avancee).
    hasUserPurchased = async (userId, productId) => {
        const [rows] = await db.query(
            `SELECT oi.id
               FROM order_items oi
               JOIN orders o ON oi.order_id = o.id
              WHERE o.user_id = ?
                AND oi.product_id = ?
                AND o.status IN ('payee','en_preparation','expediee','livree')
              LIMIT 1`,
            [userId, productId]
        )
        return rows.length > 0
    }

    findByUserForExport = async (userId) => {
        const [rows] = await db.query(
            `SELECT oi.order_id, oi.product_id, oi.quantity, oi.unit_price, p.name AS product_name
               FROM order_items oi
               JOIN orders o ON oi.order_id = o.id
               LEFT JOIN products p ON oi.product_id = p.id
              WHERE o.user_id = ?`,
            [userId]
        )
        return rows
    }
}

export const orderItemRepository = new OrderItemRepository()
