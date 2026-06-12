import {Repository} from "../core/Repository.js";
import {db} from "../core/database.js";
import {ProductReview} from "../entity/ProductReview.js";

class ProductReviewRepository extends Repository {

    constructor() {
        super(ProductReview, "product_reviews");
    }

    findApprovedByProduct = async (productId) => {
        const [rows] = await db.query(
            `SELECT r.id, r.rating, r.title, r.comment, r.created_at,
                    u.first_name AS author_first_name
               FROM product_reviews r
               JOIN users u ON r.user_id = u.id
              WHERE r.product_id = ? AND r.status = 'approved'
              ORDER BY r.created_at DESC`,
            [productId]
        )
        return rows
    }

    aggregateForProduct = async (productId) => {
        const [rows] = await db.query(
            `SELECT COUNT(*) AS count, COALESCE(AVG(rating), 0) AS avg_rating
               FROM product_reviews WHERE product_id = ? AND status = 'approved'`,
            [productId]
        )
        return rows[0]
    }

    existsForUserAndProduct = async (userId, productId) => {
        const [rows] = await db.query(
            "SELECT id FROM product_reviews WHERE user_id = ? AND product_id = ? LIMIT 1",
            [userId, productId]
        )
        return rows.length > 0
    }

    findByStatusForAdmin = async (status) => {
        const [rows] = await db.query(
            `SELECT r.id, r.rating, r.title, r.comment, r.status, r.created_at,
                    p.id AS product_id, p.name AS product_name,
                    u.id AS user_id, u.email AS user_email, u.first_name, u.last_name
               FROM product_reviews r
               JOIN products p ON r.product_id = p.id
               JOIN users u ON r.user_id = u.id
              WHERE r.status = ?
              ORDER BY r.created_at DESC
              LIMIT 200`,
            [status]
        )
        return rows
    }

    updateStatus = async (id, status) => {
        const [result] = await db.query("UPDATE product_reviews SET status = ? WHERE id = ?", [status, id])
        return result.affectedRows > 0
    }
}

export const productReviewRepository = new ProductReviewRepository()
