import {productReviewRepository} from "../../repository/ProductReviewRepository.js";
import {ValidationException, NotFoundException} from "../../error/HttpException.js";

const VALID_STATUSES = ["pending", "approved", "rejected"]

export class AdminReviewController {

    // GET /api/admin/reviews?status=pending
    static getReviews = async (req, res, next) => {
        try
        {
            const status = VALID_STATUSES.includes(req.query.status)
                ? req.query.status
                : "pending"

            const reviews = await productReviewRepository.findByStatusForAdmin(status)

            return res.status(200).json({
                message: "Reviews fetched successfully",
                reviews
            })
        }
        catch (error)
        {
            next(error)
        }
    }

    // PUT /api/admin/reviews/:id
    static updateReviewStatus = async (req, res, next) => {
        try
        {
            const id = parseInt(req.params.id, 10)
            const { status } = req.body

            if (!VALID_STATUSES.includes(status)) {
                throw new ValidationException("Statut invalide")
            }

            const updated = await productReviewRepository.updateStatus(id, status)

            if (!updated) {
                throw new NotFoundException("Avis")
            }

            return res.status(200).json({ message: "Statut mis a jour" })
        }
        catch (error)
        {
            next(error)
        }
    }
}
