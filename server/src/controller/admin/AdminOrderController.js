import {orderRepository} from "../../repository/OrderRepository.js";
import {ValidationException, NotFoundException} from "../../error/HttpException.js";

const VALID_STATUSES = ["en_attente", "payee", "en_preparation", "expediee", "livree", "annulee", "remboursee"]

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

            // 'remboursee' : meme chemin que le webhook Stripe pour rester coherent
            // -> restaure le stock si la commande etait 'payee' (la marchandise non
            // expediee revient en stock) et garantit la valeur ENUM (ensureColumns).
            if (status === "remboursee") {
                await orderRepository.ensureColumns()
                const order = await orderRepository.find(req.params.id)
                if (!order) {
                    throw new NotFoundException("Commande")
                }
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
