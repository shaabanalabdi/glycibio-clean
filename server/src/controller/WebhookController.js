import {orderRepository} from "../repository/OrderRepository.js";
import {userRepository} from "../repository/UserRepository.js";
import {StripeService} from "../services/StripeService.js";
import {EmailService} from "../services/EmailService.js";
import {Logger} from "../services/Logger.js";
import {resolveWebhookAction} from "../services/WebhookEvents.js";

const markOrderPaid = async (orderId, paymentIntentId) => {
    const order = await orderRepository.markPaid(orderId, paymentIntentId)
    if (!order) return

    const user = await userRepository.find(order.user_id)
    if (user) {
        await EmailService.sendOrderConfirmation(user.email, order)
    }
}

export class WebhookController {

    // POST /api/webhooks/stripe
    // Traite les evenements Stripe :
    //   - checkout.session.completed       -> marquer commande "payee"
    //   - checkout.session.expired         -> annuler + restaurer le stock
    //   - payment_intent.payment_failed    -> annuler + restaurer le stock
    static handleStripe = async (req, res) => {
        if (!(await StripeService.isConfigured())) {
            return res.status(200).json({ received: true })
        }

        const signature = req.headers["stripe-signature"]
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

        // En production, on REFUSE tout webhook non signe (sinon n'importe qui
        // peut forger un evenement et faire passer une commande en "payee").
        if (!webhookSecret) {
            if (process.env.NODE_ENV === "production") {
                Logger.error("[Webhook] STRIPE_WEBHOOK_SECRET manquant en production - rejet")
                return res.status(503).json({ error: "Webhook non configure" })
            }
            Logger.warn("[Webhook] STRIPE_WEBHOOK_SECRET absent : mode dev, signature non verifiee")
        }

        let event
        try
        {
            event = webhookSecret
                ? await StripeService.constructWebhookEvent(req.body, signature, webhookSecret)
                : JSON.parse(req.body.toString())
        }
        catch (err)
        {
            Logger.error("[Webhook] Signature invalide:", { msg: err.message })
            return res.status(400).json({ error: `Webhook Error: ${err.message}` })
        }

        try
        {
            // Routage PUR (teste unitairement, cf. services/WebhookEvents.js) :
            // le controleur ne fait plus qu'EXECUTER l'action retournee.
            const { action, orderId, paymentIntentId } = resolveWebhookAction(event)

            if (action === "markPaid") {
                await markOrderPaid(orderId, paymentIntentId)
            } else if (action === "cancelRestoreStock") {
                await orderRepository.cancelPendingAndRestoreStock(orderId, event.type)
            }
            // action === "ignore" : evenement non pertinent -> aucune action
        }
        catch (dbErr)
        {
            Logger.error("[Webhook] Erreur traitement:", { msg: dbErr.message })
            // 5xx (et NON 200) pour que Stripe RETENTE la livraison : un echec
            // transitoire (BDD indisponible) ne doit pas perdre l'evenement.
            // Le traitement est idempotent, une nouvelle tentative est sans risque.
            return res.status(500).json({
                received: false,
                error: "Traitement differe, nouvelle tentative attendue"
            })
        }

        return res.status(200).json({ received: true })
    }
}
