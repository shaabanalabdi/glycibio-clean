import {Entity} from "../core/Entity.js";

export class ProductImage extends Entity {

    id = null
    product_id = null
    url = ""
    alt = null
    position = 0

    constructor(productImage) {
        super(productImage)
    }
}
