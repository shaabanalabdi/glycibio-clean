import {productReviewRepository} from "../repository/ProductReviewRepository.js";
import {orderItemRepository} from "../repository/OrderItemRepository.js";
import {ProductReview} from "../entity/ProductReview.js";
import {Validator} from "../services/Validator.js";
import {
    ValidationException,
    ForbiddenException,
    ConflictException
} from "../error/HttpException.js";

export class ReviewController {

    // GET /api/products/:id/reviews — public : seuls les avis approuves
    static getProductReviews = async (req, res, next) => {
        try
        {
            const productId = parseInt(req.params.id, 10)
            if (!productId) {
                throw new ValidationException("ID invalide")
            }

            const reviews = await productReviewRepository.findApprovedByProduct(productId)
            const agg = await productReviewRepository.aggregateForProduct(productId)

            return res.status(200).json({
                message: "Reviews fetched successfully",
                reviews,
                count: agg.count,
                average: Number(parseFloat(agg.avg_rating).toFixed(2))
            })
        }
        catch (error)
        {
            next(error)
        }
    }

    // POST /api/products/:id/reviews
    // Requiert que l'utilisateur ait commande ce produit (commandes payees+)
    static createReview = async (req, res, next) => {
        try
        {
            const productId = parseInt(req.params.id, 10)
            const { rating, title, comment } = req.body

            if (!productId) {
                throw new ValidationException("ID produit invalide")
            }
            const ratingInt = parseInt(rating, 10)
            if (!ratingInt || ratingInt < 1 || ratingInt > 5) {
                throw new ValidationException("La note doit etre entre 1 et 5")
            }
            if (!comment || typeof comment !== "string" || comment.trim().length < 10) {
                throw new ValidationException("Le commentaire doit contenir au moins 10 caracteres")
            }
            if (comment.length > 2000) {
                throw new ValidationException("Le commentaire est trop long (max 2000 caracteres)")
            }

            const hasPurchased = await orderItemRepository.hasUserPurchased(req.user.id, productId)

            if (!hasPurchased) {
                throw new ForbiddenException("Vous ne pouvez laisser un avis que sur un produit que vous avez achete.")
            }

            const alreadyReviewed = await productReviewRepository.existsForUserAndProduct(req.user.id, productId)

            if (alreadyReviewed) {
                throw new ConflictException("Vous avez deja laisse un avis sur ce produit.")
            }

            const review = new ProductReview()
            review.product_id = productId
            review.user_id = req.user.id
            review.rating = ratingInt
            review.title = title ? title.slice(0, 120) : null
            review.comment = comment.trim()
            review.status = "pending"

            await productReviewRepository.save(review)

            return res.status(201).json({
                message: "Merci pour votre avis ! Il sera publie apres moderation."
            })
        }
        catch (error)
        {
            next(error)
        }
    }
}
