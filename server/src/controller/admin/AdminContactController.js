import {contactMessageRepository} from "../../repository/ContactMessageRepository.js";
import {NotFoundException} from "../../error/HttpException.js";

export class AdminContactController {

    // GET /api/admin/contacts
    static getContacts = async (req, res, next) => {
        try
        {
            const messages = await contactMessageRepository.findAllSorted()

            return res.status(200).json({
                message: "Contact messages fetched successfully",
                messages
            })
        }
        catch (error)
        {
            next(error)
        }
    }

    // PUT /api/admin/contacts/:id/read
    static markAsRead = async (req, res, next) => {
        try
        {
            const updated = await contactMessageRepository.markAsRead(req.params.id)

            if (!updated) {
                throw new NotFoundException("Message")
            }

            return res.status(200).json({ message: "Message marque comme lu" })
        }
        catch (error)
        {
            next(error)
        }
    }
}
