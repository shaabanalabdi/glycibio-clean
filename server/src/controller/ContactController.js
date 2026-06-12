import {contactMessageRepository} from "../repository/ContactMessageRepository.js";
import {ContactMessage} from "../entity/ContactMessage.js";
import {Validator} from "../services/Validator.js";
import {Logger} from "../services/Logger.js";
import {ValidationException} from "../error/HttpException.js";

export class ContactController {

    // POST /api/contact
    static sendMessage = async (req, res, next) => {
        try
        {
            const { name, email, subject, message, website } = req.body

            // Honeypot : champ "website" cache, doit etre vide. Si rempli = bot.
            // On retourne 201 OK pour ne pas signaler le filtrage au spammeur.
            if (!Validator.isHoneypotEmpty(website)) {
                Logger.warn(`[contact] Honeypot declenche depuis ${req.ip}`)
                return res.status(201).json({ message: "Message envoye avec succes" })
            }

            const errors = {}
            if (!Validator.isStringLengthValid(name || "", 2, 100)) errors.name = "Le nom est obligatoire (2 a 100 caracteres)"
            if (!Validator.isEmailValid(email)) errors.email = "Email invalide"
            if (!Validator.isStringLengthValid(subject || "", 3, 200)) errors.subject = "Le sujet est obligatoire (3 a 200 caracteres)"
            if (!Validator.isStringLengthValid(message || "", 10, 2000)) errors.message = "Le message doit contenir entre 10 et 2000 caracteres"

            if (Object.keys(errors).length > 0) {
                throw new ValidationException(Object.values(errors).join(", "), errors)
            }

            const contactMessage = new ContactMessage()
            contactMessage.name = name
            contactMessage.email = email
            contactMessage.subject = subject
            contactMessage.message = message

            await contactMessageRepository.save(contactMessage)

            return res.status(201).json({ message: "Message envoye avec succes" })
        }
        catch (error)
        {
            next(error)
        }
    }
}
