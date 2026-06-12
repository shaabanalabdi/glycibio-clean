import {Entity} from "../core/Entity.js";

export class User extends Entity {

    id = null
    username = ""
    email = ""
    password = ""
    role = "client"
    first_name = null
    last_name = null
    address = null
    phone = null
    newsletter_opt_in = 0
    newsletter_opt_in_at = null
    is_active = true

    constructor(user) {
        super(user)
    }
}
