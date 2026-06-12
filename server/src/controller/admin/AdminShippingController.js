import {shippingMethodRepository} from "../../repository/ShippingMethodRepository.js";
import {ShippingMethod} from "../../entity/ShippingMethod.js";
import {ValidationException, NotFoundException} from "../../error/HttpException.js";

export class AdminShippingController {

    // GET /api/admin/shipping
    static getShippingMethods = async (req, res, next) => {
        try
        {
            const methods = await shippingMethodRepository.findAllForAdmin()

            return res.status(200).json({
                message: "Shipping methods fetched successfully",
                methods
            })
        }
        catch (error)
        {
            next(error)
        }
    }

    // POST /api/admin/shipping
    static createShippingMethod = async (req, res, next) => {
        try
        {
            const { name, price, estimated_days, is_active } = req.body

            if (!name || price === undefined || estimated_days === undefined) {
                throw new ValidationException("name, price et estimated_days sont obligatoires")
            }

            if (Number(price) < 0 || Number(estimated_days) <= 0) {
                throw new ValidationException("price doit etre >= 0 et estimated_days > 0")
            }

            const method = new ShippingMethod()
            method.name = name
            method.price = Number(price)
            method.estimated_days = parseInt(estimated_days, 10)
            method.is_active = is_active !== false

            const methodId = await shippingMethodRepository.save(method)

            return res.status(201).json({
                message: "Mode de livraison cree",
                method: { id: methodId }
            })
        }
        catch (error)
        {
            next(error)
        }
    }

    // PUT /api/admin/shipping/:id
    static updateShippingMethod = async (req, res, next) => {
        try
        {
            const { name, price, estimated_days, is_active } = req.body
            const updates = []
            const params = []

            if (name !== undefined) {
                if (!name) {
                    throw new ValidationException("Le nom ne peut pas etre vide")
                }
                updates.push("name = ?")
                params.push(name)
            }

            if (price !== undefined) {
                if (Number(price) < 0) {
                    throw new ValidationException("price doit etre >= 0")
                }
                updates.push("price = ?")
                params.push(Number(price))
            }

            if (estimated_days !== undefined) {
                if (Number(estimated_days) <= 0) {
                    throw new ValidationException("estimated_days doit etre > 0")
                }
                updates.push("estimated_days = ?")
                params.push(parseInt(estimated_days, 10))
            }

            if (is_active !== undefined) {
                updates.push("is_active = ?")
                params.push(!!is_active)
            }

            if (updates.length === 0) {
                throw new ValidationException("Aucune modification fournie")
            }

            const updated = await shippingMethodRepository.updatePartial(req.params.id, updates, params)

            if (!updated) {
                throw new NotFoundException("Mode de livraison")
            }

            return res.status(200).json({ message: "Mode de livraison mis a jour" })
        }
        catch (error)
        {
            next(error)
        }
    }

    // DELETE /api/admin/shipping/:id (desactivation)
    static deleteShippingMethod = async (req, res, next) => {
        try
        {
            const deactivated = await shippingMethodRepository.deactivate(req.params.id)

            if (!deactivated) {
                throw new NotFoundException("Mode de livraison")
            }

            return res.status(200).json({ message: "Mode de livraison desactive" })
        }
        catch (error)
        {
            next(error)
        }
    }
}
