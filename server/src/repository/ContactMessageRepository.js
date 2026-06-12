import {Repository} from "../core/Repository.js";
import {db} from "../core/database.js";
import {ContactMessage} from "../entity/ContactMessage.js";

class ContactMessageRepository extends Repository {

    constructor() {
        super(ContactMessage, "contact_messages");
    }

    findAllSorted = async () => {
        const [rows] = await db.query("SELECT * FROM contact_messages ORDER BY is_read ASC, created_at DESC")
        return rows
    }

    markAsRead = async (id) => {
        const [result] = await db.query("UPDATE contact_messages SET is_read = TRUE WHERE id = ?", [id])
        return result.affectedRows > 0
    }
}

export const contactMessageRepository = new ContactMessageRepository()
