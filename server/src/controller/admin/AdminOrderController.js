import {orderRepository} from "../../repository/OrderRepository.js";
import {ValidationException, NotFoundException} from "../../error/HttpException.js";

const VALID_STATUSES = ["en_attente", "payee", "en_preparation", "expediee", "livree", "annulee", "remboursee"]

// Machine à états : transitions de statut autorisées. Sécurise le cycle de vie de
// la commande — empêche les sauts illogiques (ex. en_attente -> livree sans paiement).
const STATUS_TRANSITIONS = {
    en_attente:     ["payee", "annulee"],
    payee:          ["en_preparation", "expediee", "annulee", "remboursee"],
    en_preparation: ["expediee", "annulee", "remboursee"],
    expediee:       ["livree", "remboursee"],
    livree:         ["remboursee"],
    annulee:        [],
    remboursee:     []
}

export class AdminOrderController {

    // GET /api/admin/orders
    static getOrders = async (req, res, next) => {
        try
        {
            const orders = await orderRepository.findAllWithCustomer()

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

    // PUT /api/admin/orders/:id/status
    static updateStatus = async (req, res, next) => {
        try
        {
            const { status } = req.body

            if (!status || !VALID_STATUSES.includes(status)) {
                throw new ValidationException(`Statut invalide. Valeurs acceptees : ${VALID_STATUSES.join(", ")}`)
            }

            await orderRepository.ensureColumns()
            const order = await orderRepository.find(req.params.id)
            if (!order) {
                throw new NotFoundException("Commande")
            }

            // Machine à états : refuse les transitions illogiques (ex. en_attente ->
            // livree sans paiement). No-op accepté si le statut est inchangé.
            if (status !== order.status) {
                const allowed = STATUS_TRANSITIONS[order.status] || []
                if (!allowed.includes(status)) {
                    throw new ValidationException(`Transition de statut invalide : ${order.status} -> ${status}`)
                }
            }

            // 'remboursee' : meme chemin que le webhook Stripe (restaure le stock si
            // la commande etait payee — la marchandise non expediee revient en stock).
            if (status === "remboursee") {
                await orderRepository.refundAndRestoreStock(req.params.id, "admin")
                return res.status(200).json({ message: "Statut mis a jour : remboursee" })
            }

            const updated = await orderRepository.updateStatus(req.params.id, status)
            if (!updated) {
                throw new NotFoundException("Commande")
            }

            return res.status(200).json({ message: `Statut mis a jour : ${status}` })
        }
        catch (error)
        {
            next(error)
        }
    }
}
