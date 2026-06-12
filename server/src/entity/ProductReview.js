import {Entity} from "../core/Entity.js";

export class ProductReview extends Entity {

    id = null
    product_id = null
    user_id = null
    rating = null
    title = null
    comment = ""
    status = "pending"

    constructor(productReview) {
        super(productReview)
    }
}
