import { Router } from "express"
import {ContactController} from "../../controller/ContactController.js";
import {contactLimiter} from "../../middleware/rateLimiter.js";

export const contactRoutes = Router()

contactRoutes.post("/", contactLimiter, ContactController.sendMessage)
