import {Entity} from "../core/Entity.js";

export class CartItem extends Entity {

    id = null
    user_id = null
    product_id = null
    quantity = 1

    constructor(cartItem) {
        super(cartItem)
    }
}
