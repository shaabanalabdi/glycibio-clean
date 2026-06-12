import {Repository} from "../core/Repository.js";
import {db} from "../core/database.js";
import {Category} from "../entity/Category.js";

class CategoryRepository extends Repository {

    constructor() {
        super(Category, "categories");
    }

    findAllWithCounts = async () => {
        const [rows] = await db.query(
            `SELECT c.*,
                    COUNT(p.id) AS products_count,
                    SUM(CASE WHEN p.is_active = TRUE THEN 1 ELSE 0 END) AS active_products_count
             FROM categories c
             LEFT JOIN products p ON p.category_id = c.id
             GROUP BY c.id
             ORDER BY c.name ASC`
        )
        return rows
    }

    updatePartial = async (id, { name, description }) => {
        const [result] = await db.query(
            "UPDATE categories SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?",
            [name || null, description || null, id]
        )
        return result.affectedRows > 0
    }

    deleteById = async (id) => {
        const [result] = await db.query("DELETE FROM categories WHERE id = ?", [id])
        return result.affectedRows > 0
    }
}

export const categoryRepository = new CategoryRepository()
