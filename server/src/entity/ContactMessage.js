import {Entity} from "../core/Entity.js";

export class ContactMessage extends Entity {

    id = null
    name = ""
    email = ""
    subject = ""
    message = ""
    is_read = false

    constructor(contactMessage) {
        super(contactMessage)
    }
}
