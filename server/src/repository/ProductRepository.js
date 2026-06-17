import {Repository} from "../core/Repository.js";
import {db} from "../core/database.js";
import {Product} from "../entity/Product.js";

class ProductRepository extends Repository {

    constructor() {
        super(Product, "products");
    }

    // Catalogue public : filtres IG / prix / allergenes / recherche + pagination
    findAllFiltered = async ({ category, ig, search, sort, price_min, price_max, exclude_allergens, page = 1, limit = 10 }) => {
        const offset = (page - 1) * limit

        let sql = `
          SELECT p.*, c.name AS category_name,
                 vpr.avg_rating, vpr.reviews_count
          FROM products p
          JOIN categories c ON p.category_id = c.id
          LEFT JOIN v_product_ratings vpr ON vpr.product_id = p.id
          WHERE p.is_active = TRUE
        `
        const params = []

        if (category) {
            sql += " AND p.category_id = ?"
            params.push(parseInt(category))
        }

        if (ig === "bas") {
            sql += " AND p.glycemic_index <= 55"
        } else if (ig === "moyen") {
            sql += " AND p.glycemic_index BETWEEN 56 AND 69"
        } else if (ig === "eleve") {
            sql += " AND p.glycemic_index >= 70"
        }

        if (search) {
            const term = String(search).trim()
            // On exploite l'index FULLTEXT idx_products_search (name, description)
            // via MATCH ... AGAINST en mode booleen, au lieu d'un LIKE '%...%'
            // a joker initial qu'AUCUN index ne peut servir (scan complet).
            // Les caracteres speciaux du mode booleen (+ - * " ( ) ~ < > @) sont
            // neutralises pour eviter une erreur de syntaxe / injection d'operateur.
            const tokens = term
                .replace(/[+\-><()~*"@]+/g, " ")
                .split(/\s+/)
                .filter((t) => t.length >= 2)

            if (term.length >= 3 && tokens.length > 0) {
                const booleanExpr = tokens.map((t) => `+${t}*`).join(" ")
                sql += " AND MATCH(p.name, p.description) AGAINST (? IN BOOLEAN MODE)"
                params.push(booleanExpr)
            } else {
                // Repli LIKE pour les termes tres courts (< longueur mini fulltext)
                sql += " AND (p.name LIKE ? OR p.description LIKE ?)"
                params.push(`%${term}%`, `%${term}%`)
            }
        }

        if (price_min !== undefined && price_min !== "") {
            const min = parseFloat(price_min)
            if (!Number.isNaN(min)) {
                sql += " AND p.price >= ?"
                params.push(min)
            }
        }
        if (price_max !== undefined && price_max !== "") {
            const max = parseFloat(price_max)
            if (!Number.isNaN(max)) {
                sql += " AND p.price <= ?"
                params.push(max)
            }
        }

        // exclude_allergens=gluten,lactose -> exclut les produits qui en contiennent
        if (exclude_allergens) {
            const list = String(exclude_allergens).split(",").map((a) => a.trim()).filter(Boolean)
            for (const allergen of list) {
                sql += " AND (p.allergens IS NULL OR NOT JSON_CONTAINS(p.allergens, JSON_QUOTE(?)))"
                params.push(allergen)
            }
        }

        // Compte robuste : on remplace toute la liste SELECT (quelles que soient
        // les colonnes ajoutees, ex. notes) par COUNT(*).
        const countSql = sql.replace(/SELECT[\s\S]*?\sFROM/, "SELECT COUNT(*) AS total FROM")
        const [countResult] = await db.query(countSql, params)
        const total = countResult[0].total

        switch (sort) {
            case "price_asc":  sql += " ORDER BY p.price ASC"; break
            case "price_desc": sql += " ORDER BY p.price DESC"; break
            case "name_asc":   sql += " ORDER BY p.name ASC"; break
            case "ig_asc":     sql += " ORDER BY p.glycemic_index ASC"; break
            default:           sql += " ORDER BY p.created_at DESC"
        }

        sql += " LIMIT ? OFFSET ?"
        params.push(limit, offset)

        const [products] = await db.query(sql, params)

        return {
            products,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        }
    }

    // Accepte un id numerique OU un slug SEO
    findActiveByIdOrSlug = async (key) => {
        const lookupByNumericId = /^\d+$/.test(key)
        const [rows] = await db.query(
            `SELECT p.*, c.name AS category_name,
                    vpr.avg_rating, vpr.reviews_count
             FROM products p
             JOIN categories c ON p.category_id = c.id
             LEFT JOIN v_product_ratings vpr ON vpr.product_id = p.id
             WHERE p.is_active = TRUE AND ${lookupByNumericId ? "p.id = ?" : "p.slug = ?"}
             LIMIT 1`,
            [key]
        )
        return rows.length === 0 ? null : rows[0]
    }

    findRelated = async (categoryId, excludeId) => {
        const [rows] = await db.query(
            `SELECT p.id, p.slug, p.name, p.price, p.image, p.stock, p.glycemic_index, p.ig_category, c.name AS category_name,
                    vpr.avg_rating, vpr.reviews_count
               FROM products p
               JOIN categories c ON p.category_id = c.id
               LEFT JOIN v_product_ratings vpr ON vpr.product_id = p.id
              WHERE p.is_active = TRUE
                AND p.category_id = ?
                AND p.id <> ?
              ORDER BY RAND()
              LIMIT 4`,
            [categoryId, excludeId]
        )
        return rows
    }

    findActiveById = async (id) => {
        const [rows] = await db.query(
            "SELECT id, name, stock FROM products WHERE id = ? AND is_active = TRUE",
            [id]
        )
        return rows.length === 0 ? null : rows[0]
    }

    findAllForAdmin = async ({ search, category, status }) => {
        let sql = `
          SELECT p.*, c.name AS category_name
          FROM products p
          JOIN categories c ON c.id = p.category_id
          WHERE 1 = 1
        `
        const params = []

        if (search) {
            sql += " AND (p.name LIKE ? OR p.description LIKE ?)"
            const term = `%${search}%`
            params.push(term, term)
        }

        if (category) {
            sql += " AND p.category_id = ?"
            params.push(parseInt(category, 10))
        }

        if (status === "active") {
            sql += " AND p.is_active = TRUE"
        } else if (status === "inactive") {
            sql += " AND p.is_active = FALSE"
        }

        sql += " ORDER BY p.created_at DESC"

        const [rows] = await db.query(sql, params)
        return rows
    }

    findByIdAdmin = async (id) => {
        const [rows] = await db.query(
            `SELECT p.*, c.name AS category_name
             FROM products p
             JOIN categories c ON c.id = p.category_id
             WHERE p.id = ?`,
            [id]
        )
        return rows.length === 0 ? null : rows[0]
    }

    // Mise a jour partielle : COALESCE garde la valeur actuelle si null.
    // (le save generique est evite ici a cause de la colonne generee ig_category)
    updatePartial = async (id, { name, description, price, image, stock, glycemic_index, allergens, nutritional_info, category_id, is_active }) => {
        await db.query(
            `UPDATE products SET
               name = COALESCE(?, name),
               description = COALESCE(?, description),
               price = COALESCE(?, price),
               image = COALESCE(?, image),
               stock = COALESCE(?, stock),
               glycemic_index = COALESCE(?, glycemic_index),
               allergens = COALESCE(?, allergens),
               nutritional_info = COALESCE(?, nutritional_info),
               category_id = COALESCE(?, category_id),
               is_active = COALESCE(?, is_active)
             WHERE id = ?`,
            [name, description, price, image, stock, glycemic_index, allergens, nutritional_info, category_id, is_active, id]
        )
    }

    updateSlug = async (id, slug) => {
        await db.query("UPDATE products SET slug = ? WHERE id = ?", [slug, id])
    }

    softDelete = async (id) => {
        const [result] = await db.query("UPDATE products SET is_active = FALSE WHERE id = ?", [id])
        return result.affectedRows > 0
    }

    countOrderReferences = async (id) => {
        const [rows] = await db.query("SELECT COUNT(*) AS cnt FROM order_items WHERE product_id = ?", [id])
        return rows[0].cnt
    }

    hardDelete = async (id) => {
        const [result] = await db.query("DELETE FROM products WHERE id = ?", [id])
        return result.affectedRows > 0
    }

    findTopProducts = async () => {
        const [rows] = await db.query("SELECT * FROM v_top_products LIMIT 5")
        return rows
    }

    findActiveForSitemap = async () => {
        const [rows] = await db.query("SELECT id, slug, updated_at FROM products WHERE is_active = TRUE")
        return rows
    }
}

export const productRepository = new ProductRepository()
