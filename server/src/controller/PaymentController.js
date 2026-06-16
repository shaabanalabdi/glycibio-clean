import {orderRepository} from "../repository/OrderRepository.js";
import {StripeService} from "../services/StripeService.js";
import {Validator} from "../services/Validator.js";
import {Logger} from "../services/Logger.js";
import {sendOrderConfirmationOnce} from "../services/OrderConfirmation.js";
import {
    ValidationException,
    NotFoundException,
    ServiceUnavailableException
} from "../error/HttpException.js";

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173"

export class PaymentController {

    // POST /api/payments/create-checkout
    // Cree une commande en attente puis une session Stripe Checkout
    static createCheckout = async (req, res, next) => {
        try
        {
            if (!(await StripeService.isConfigured())) {
                throw new ServiceUnavailableException("Le paiement en ligne n'est pas configure (STRIPE_SECRET_KEY manquant).")
            }

            const { shipping_address, shipping_method_id, cgv_accepted } = req.body

            if (!Validator.isAddressValid(shipping_address)) {
                throw new ValidationException("L'adresse de livraison est obligatoire (10 caracteres minimum)")
            }
            if (cgv_accepted !== true) {
                throw new ValidationException("Vous devez accepter les Conditions Generales de Vente")
            }

            const { orderId, cartItems, shippingCost, shippingName } = await orderRepository.createPendingFromCart(
                req.user.id, shipping_address, shipping_method_id
            )

            const lineItems = cartItems.map((item) => ({
                price_data: {
                    currency: "eur",
                    product_data: { name: item.name },
                    unit_amount: Math.round(parseFloat(item.price) * 100)
                },
                quantity: item.quantity
            }))

            if (shippingCost > 0) {
                lineItems.push({
                    price_data: {
                        currency: "eur",
                        product_data: { name: shippingName },
                        unit_amount: Math.round(shippingCost * 100)
                    },
                    quantity: 1
                })
            }

            const session = await StripeService.createCheckoutSession({
                payment_method_types: ["card"],
                line_items: lineItems,
                mode: "payment",
                success_url: `${CLIENT_URL}/commande/succes?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${CLIENT_URL}/panier`,
                metadata: { order_id: String(orderId), user_id: String(req.user.id) },
                // Propager order_id au PaymentIntent pour les webhooks
                payment_intent_data: {
                    metadata: { order_id: String(orderId), user_id: String(req.user.id) }
                },
                expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 23 // 23h (max 24h)
            })

            await orderRepository.setStripeSession(orderId, session.id)

            return res.status(200).json({
                message: "Checkout session created successfully",
                checkout_url: session.url,
                order_id: orderId
            })
        }
        catch (error)
        {
            next(error)
        }
    }

    // GET /api/payments/success?session_id=...
    // Verifie le paiement Stripe et marque la commande comme payee
    static handleSuccess = async (req, res, next) => {
        try
        {
            if (!(await StripeService.isConfigured())) {
                throw new ServiceUnavailableException("Stripe non configure")
            }

            const { session_id } = req.query

            if (!session_id) {
                throw new ValidationException("session_id manquant")
            }

            const session = await StripeService.retrieveCheckoutSession(session_id)

            if (session.payment_status !== "paid") {
                throw new ValidationException("Paiement non confirme")
            }

            const orderId = session.metadata.order_id

            const order = await orderRepository.findByIdForUser(orderId, req.user.id)

            if (!order) {
                throw new NotFoundException("Commande")
            }

            if (order.status === "en_attente") {
                await orderRepository.markPaid(orderId, session.payment_intent)
            }

            // Email de confirmation idempotent et decouple. Best-effort cote
            // utilisateur : un echec d'envoi ne doit PAS casser la page de succes
            // (le webhook Stripe, lui, retentera l'envoi). On l'appelle aussi si la
            // commande etait deja 'payee' (webhook arrive avant) pour rattraper un
            // eventuel email non encore parti.
            try {
                await sendOrderConfirmationOnce(orderId)
            } catch (mailErr) {
                Logger.warn(`[PaymentController] Email confirmation differe pour #${orderId}: ${mailErr.message}`)
            }

            const updatedOrder = await orderRepository.find(orderId)

            return res.status(200).json({
                message: "Payment verified successfully",
                order: updatedOrder
            })
        }
        catch (error)
        {
            next(error)
        }
    }
}
