import {cartItemRepository} from "../repository/CartItemRepository.js";
import {productRepository} from "../repository/ProductRepository.js";
import {Validator} from "../services/Validator.js";
import {ValidationException, NotFoundException} from "../error/HttpException.js";

const buildCart = async (userId) => {
    const items = await cartItemRepository.findByUserWithProducts(userId)
    const total = items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0)

    return { items, total: total.toFixed(2), itemCount: items.length }
}

export class CartController {

    // GET /api/cart
    static getCart = async (req, res, next) => {
        try
        {
            const cart = await buildCart(req.user.id)

            return res.status(200).json({
                message: "Cart fetched successfully",
                cart
            })
        }
        catch (error)
        {
            next(error)
        }
    }

    // POST /api/cart
    static addToCart = async (req, res, next) => {
        try
        {
            const { product_id, quantity } = req.body

            if (!Validator.isIdValid(product_id)) {
                throw new ValidationException("product_id est obligatoire")
            }
            if (!Validator.isQuantityValid(quantity)) {
                throw new ValidationException("La quantite doit etre au moins 1")
            }

            const product = await productRepository.findActiveById(product_id)

            if (!product) {
                throw new NotFoundException("Produit")
            }

            // Quantite totale (existant + ajout) bornee par le stock
            const currentQty = await cartItemRepository.findQuantity(req.user.id, product_id)
            const newTotal = currentQty + Number(quantity)

            if (newTotal > product.stock) {
                const remaining = Math.max(0, product.stock - currentQty)
                throw new ValidationException(remaining === 0
                    ? `Stock insuffisant : vous avez deja le maximum (${product.stock}) dans votre panier.`
                    : `Stock insuffisant : seulement ${remaining} unite(s) supplementaire(s) disponible(s) (deja ${currentQty} dans le panier).`)
            }

            await cartItemRepository.upsertItem(req.user.id, product_id, quantity)

            return res.status(201).json({
                message: `${product.name} ajoute au panier`
            })
        }
        catch (error)
        {
            next(error)
        }
    }

    // PUT /api/cart/:id
    static updateQuantity = async (req, res, next) => {
        try
        {
            const { quantity } = req.body

            if (!Validator.isQuantityValid(quantity)) {
                throw new ValidationException("La quantite doit etre au moins 1")
            }

            const item = await cartItemRepository.findItemWithStock(req.params.id, req.user.id)

            if (!item) {
                throw new NotFoundException("Article")
            }

            if (item.stock < quantity) {
                throw new ValidationException(`Stock insuffisant. Disponible : ${item.stock}`)
            }

            await cartItemRepository.updateQuantity(req.params.id, quantity)

            return res.status(200).json({ message: "Quantite mise a jour" })
        }
        catch (error)
        {
            next(error)
        }
    }

    // DELETE /api/cart/:id
    static removeFromCart = async (req, res, next) => {
        try
        {
            const removed = await cartItemRepository.removeItem(req.params.id, req.user.id)

            if (!removed) {
                throw new NotFoundException("Article")
            }

            return res.status(200).json({ message: "Article supprime du panier" })
        }
        catch (error)
        {
            next(error)
        }
    }

    // DELETE /api/cart — vide entierement le panier
    static clearCart = async (req, res, next) => {
        try
        {
            await cartItemRepository.clearForUser(req.user.id)
            return res.status(200).json({ message: "Panier vide" })
        }
        catch (error)
        {
            next(error)
        }
    }

    // POST /api/cart/merge
    // Fusionne un panier guest (envoye par le client apres login) dans le
    // panier serveur. Quantites capees au stock, produits invalides ignores.
    static mergeCart = async (req, res, next) => {
        try
        {
            const items = Array.isArray(req.body?.items) ? req.body.items : []

            // Limite anti-abus : 100 items max
            if (items.length > 100) {
                throw new ValidationException("Trop d'articles a fusionner")
            }

            for (const item of items) {
                const productId = Number(item?.product_id)
                const qty = Math.max(1, Math.floor(Number(item?.quantity) || 0))
                if (!productId || qty < 1) continue

                const product = await productRepository.findActiveById(productId)
                if (!product) continue

                const currentQty = await cartItemRepository.findQuantity(req.user.id, productId)
                const targetQty = Math.min(product.stock, currentQty + qty)

                if (targetQty === currentQty) continue

                await cartItemRepository.upsertItem(req.user.id, productId, targetQty - currentQty)
            }

            const cart = await buildCart(req.user.id)

            return res.status(200).json({
                message: "Cart fetched successfully",
                cart
            })
        }
        catch (error)
        {
            next(error)
        }
    }
}
