import {Entity} from "../core/Entity.js";

export class Category extends Entity {

    id = null
    name = ""
    description = null

    constructor(category) {
        super(category)
    }
}
