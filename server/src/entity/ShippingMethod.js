import {Entity} from "../core/Entity.js";

export class ShippingMethod extends Entity {

    id = null
    name = ""
    price = 0
    estimated_days = 1
    is_active = true

    constructor(shippingMethod) {
        super(shippingMethod)
    }
}
