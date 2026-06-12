import {Entity} from "../core/Entity.js";

export class OrderItem extends Entity {

    id = null
    order_id = null
    product_id = null
    quantity = 1
    unit_price = 0

    constructor(orderItem) {
        super(orderItem)
    }
}
