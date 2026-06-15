import {orderRepository} from "../repository/OrderRepository.js";
import {orderItemRepository} from "../repository/OrderItemRepository.js";
import {cartItemRepository} from "../repository/CartItemRepository.js";
import {StripeService} from "../services/StripeService.js";
import {Validator} from "../services/Validator.js";
import {ValidationException, NotFoundException, ConflictException} from "../error/HttpException.js";

const validateOrderInput = ({ shipping_address, shipping_method_id, cgv_accepted }) => {
    if (!Validator.isAddressValid(shipping_address)) {
        throw new ValidationException("L'adresse de livraison est obligatoire (10 caracteres minimum)")
    }
    if (shipping_method_id !== undefined && shipping_method_id !== null && !Validator.isIdValid(shipping_method_id)) {
        throw new ValidationException("shipping_method_id invalide")
    }
    // Art. L121-19-3 du Code de la consommation : acceptation explicite des CGV
    if (cgv_accepted !== true) {
        throw new ValidationException("Vous devez accepter les Conditions Generales de Vente")
    }
}

export class OrderController {

    // POST /api/orders
    static createOrder = async (req, res, next) => {
        try
        {
            // Garde-fou anti-abus : ce point d'entree cree une commande "en_attente"
            // SANS lien de paiement. Il n'existe QUE comme repli quand Stripe n'est
            // pas configure (cf. Checkout : appele seulement sur un 503 de
            // create-checkout). Si Stripe est actif, on REFUSE cette route : sinon
            // un client authentifie pourrait decrementer/reserver le stock en boucle
            // sans jamais payer (deni d'inventaire), en contournant Stripe.
            if (await StripeService.isConfigured()) {
                throw new ConflictException(
                    "Le paiement en ligne est requis : utilisez le tunnel de paiement (create-checkout)."
                )
            }

            const { shipping_address, shipping_method_id, cgv_accepted } = req.body

            validateOrderInput({ shipping_address, shipping_method_id, cgv_accepted })

            const { orderId } = await orderRepository.createPendingFromCart(
                req.user.id, shipping_address, shipping_method_id
            )

            // Repli sans Stripe : aucune etape de paiement -> on vide le panier
            // ici (le tunnel Stripe, lui, le vide au paiement confirme via markPaid).
            await cartItemRepository.clearForUser(req.user.id)

            const order = await orderRepository.find(orderId)

            return res.status(201).json({
                message: "Commande creee avec succes",
                order
            })
        }
        catch (error)
        {
            next(error)
        }
    }

    // GET /api/orders
    static getOrders = async (req, res, next) => {
        try
        {
            const orders = await orderRepository.findByUser(req.user.id)

            return res.status(200).json({
                message: "Orders fetched successfully",
                orders
            })
        }
        catch (error)
        {
            next(error)
        }
    }

    // GET /api/orders/:id
    static getOrder = async (req, res, next) => {
        try
        {
            const order = await orderRepository.findByIdForUser(req.params.id, req.user.id)

            if (!order) {
                throw new NotFoundException("Commande")
            }

            const items = await orderItemRepository.findByOrderWithProducts(req.params.id)

            return res.status(200).json({
                message: "Order fetched successfully",
                order: { ...order, items }
            })
        }
        catch (error)
        {
            next(error)
        }
    }

    // PUT /api/orders/:id/cancel
    static cancelOrder = async (req, res, next) => {
        try
        {
            // Verifier la propriete + statut avant de deleguer (anti-enumeration)
            const order = await orderRepository.findByIdForUser(req.params.id, req.user.id)

            if (!order) {
                throw new NotFoundException("Commande")
            }

            if (order.status !== "en_attente") {
                throw new ValidationException("Seules les commandes en attente peuvent etre annulees")
            }

            const cancelled = await orderRepository.cancelPendingAndRestoreStock(req.params.id, "user:cancelOrder")

            if (!cancelled) {
                throw new ConflictException("Commande non annulable (statut deja modifie)")
            }

            return res.status(200).json({ message: "Commande annulee avec succes" })
        }
        catch (error)
        {
            next(error)
        }
    }
}
