import * as dotenv from "dotenv";
import {Logger} from "./Logger.js";

dotenv.config();

// La cle secrete Stripe est lue depuis .env : STRIPE_SECRET_KEY=sk_test_...
// Si la cle est absente ou contient "placeholder", le paiement est desactive.
let stripe = null
let initialized = false

const getClient = async () => {
    if (initialized) return stripe
    initialized = true

    if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes("placeholder")) {
        try
        {
            const { default: Stripe } = await import("stripe")
            stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
        }
        catch (error)
        {
            Logger.warn("[StripeService] Module stripe non installe. Executez : npm install stripe")
        }
    } else {
        Logger.warn("[StripeService] Cle secrete non configuree. Le paiement est desactive.")
    }

    return stripe
}

export class StripeService {

    static isConfigured = async () => {
        return (await getClient()) !== null
    }

    static createCheckoutSession = async (params) => {
        const client = await getClient()
        return client.checkout.sessions.create(params)
    }

    static retrieveCheckoutSession = async (sessionId) => {
        const client = await getClient()
        return client.checkout.sessions.retrieve(sessionId)
    }

    static constructWebhookEvent = async (body, signature, webhookSecret) => {
        const client = await getClient()
        return client.webhooks.constructEvent(body, signature, webhookSecret)
    }
}
