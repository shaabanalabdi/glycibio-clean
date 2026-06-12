import {Repository} from "../core/Repository.js";
import {db} from "../core/database.js";
import {ProductImage} from "../entity/ProductImage.js";

class ProductImageRepository extends Repository {

    constructor() {
        super(ProductImage, "product_images");
    }

    findByProduct = async (productId) => {
        const [rows] = await db.query(
            "SELECT id, url, alt, position FROM product_images WHERE product_id = ? ORDER BY position ASC, id ASC",
            [productId]
        )
        return rows
    }

    maxPosition = async (productId) => {
        const [rows] = await db.query(
            "SELECT COALESCE(MAX(position), 0) AS m FROM product_images WHERE product_id = ?",
            [productId]
        )
        return rows[0]?.m || 0
    }

    findOneForProduct = async (imageId, productId) => {
        const [rows] = await db.query(
            "SELECT url FROM product_images WHERE id = ? AND product_id = ?",
            [imageId, productId]
        )
        return rows.length === 0 ? null : rows[0]
    }

    isUrlStillUsed = async (url) => {
        const [rows] = await db.query(
            "SELECT 1 FROM products WHERE image = ? UNION SELECT 1 FROM product_images WHERE url = ? LIMIT 1",
            [url, url]
        )
        return rows.length > 0
    }
}

export const productImageRepository = new ProductImageRepository()
