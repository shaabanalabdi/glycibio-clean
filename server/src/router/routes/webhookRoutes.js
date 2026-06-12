import { Router } from "express"
import {WebhookController} from "../../controller/WebhookController.js";

// Webhook Stripe (pas d'authentification — Stripe envoie directement).
// Monte AVANT express.json() dans App.js : necessite le raw body.
export const webhookRoutes = Router()

webhookRoutes.post("/stripe", WebhookController.handleStripe)
