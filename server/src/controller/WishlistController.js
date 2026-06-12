import {wishlistItemRepository} from "../repository/WishlistItemRepository.js";
import {productRepository} from "../repository/ProductRepository.js";
import {Validator} from "../services/Validator.js";
import {ValidationException, NotFoundException} from "../error/HttpException.js";

export class WishlistController {

    // GET /api/wishlist
    static getWishlist = async (req, res, next) => {
        try
        {
            const wishlist = await wishlistItemRepository.findByUserWithProducts(req.user.id)

            return res.status(200).json({
                message: "Wishlist fetched successfully",
                wishlist
            })
        }
        catch (error)
        {
            next(error)
        }
    }

    // GET /api/wishlist/ids — liste rapide des product_ids (synchro client)
    static getWishlistIds = async (req, res, next) => {
        try
        {
            const ids = await wishlistItemRepository.findIdsByUser(req.user.id)

            return res.status(200).json({
                message: "Wishlist ids fetched successfully",
                ids
            })
        }
        catch (error)
        {
            next(error)
        }
    }

    // POST /api/wishlist  body: { product_id }
    static addToWishlist = async (req, res, next) => {
        try
        {
            const productId = parseInt(req.body.product_id, 10)

            if (!Validator.isIdValid(productId)) {
                throw new ValidationException("product_id requis")
            }

            const product = await productRepository.findActiveById(productId)

            if (!product) {
                throw new NotFoundException("Produit")
            }

            await wishlistItemRepository.addItem(req.user.id, productId)

            return res.status(201).json({ message: "Ajoute aux favoris" })
        }
        catch (error)
        {
            next(error)
        }
    }

    // DELETE /api/wishlist/:product_id
    static removeFromWishlist = async (req, res, next) => {
        try
        {
            const productId = parseInt(req.params.product_id, 10)

            if (!Validator.isIdValid(productId)) {
                throw new ValidationException("product_id invalide")
            }

            const removed = await wishlistItemRepository.removeByUserAndProduct(req.user.id, productId)

            if (!removed) {
                throw new NotFoundException("Article")
            }

            return res.status(200).json({ message: "Retire des favoris" })
        }
        catch (error)
        {
            next(error)
        }
    }
}
