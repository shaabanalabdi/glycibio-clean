import {Repository} from "../core/Repository.js";
import {db} from "../core/database.js";
import {ShippingMethod} from "../entity/ShippingMethod.js";

class ShippingMethodRepository extends Repository {

    constructor() {
        super(ShippingMethod, "shipping_methods");
    }

    findActive = async () => {
        const [rows] = await db.query("SELECT * FROM shipping_methods WHERE is_active = TRUE")
        return rows
    }

    findAllForAdmin = async () => {
        const [rows] = await db.query(
            "SELECT * FROM shipping_methods ORDER BY is_active DESC, price ASC, created_at DESC"
        )
        return rows
    }

    updatePartial = async (id, updates, params) => {
        const [result] = await db.query(
            `UPDATE shipping_methods SET ${updates.join(", ")} WHERE id = ?`,
            [...params, id]
        )
        return result.affectedRows > 0
    }

    deactivate = async (id) => {
        const [result] = await db.query("UPDATE shipping_methods SET is_active = FALSE WHERE id = ?", [id])
        return result.affectedRows > 0
    }
}

export const shippingMethodRepository = new ShippingMethodRepository()
