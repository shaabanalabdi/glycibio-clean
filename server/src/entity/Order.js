import {Entity} from "../core/Entity.js";

export class Order extends Entity {

    id = null
    user_id = null
    subtotal = 0
    shipping_cost = 0
    total = 0
    status = "en_attente"
    shipping_address = ""
    shipping_method_id = null
    stripe_session_id = null
    stripe_payment_id = null
    notes = null

    constructor(order) {
        super(order)
    }
}
