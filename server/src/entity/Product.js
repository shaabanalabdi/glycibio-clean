import {Entity} from "../core/Entity.js";

export class Product extends Entity {

    id = null
    name = ""
    slug = null
    description = ""
    price = 0
    image = null
    stock = 0
    glycemic_index = null
    allergens = null
    nutritional_info = null
    category_id = null
    is_active = true

    constructor(product) {
        super(product)
    }
}
