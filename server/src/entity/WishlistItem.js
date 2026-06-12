import {Entity} from "../core/Entity.js";

export class WishlistItem extends Entity {

    id = null
    user_id = null
    product_id = null

    constructor(wishlistItem) {
        super(wishlistItem)
    }
}
