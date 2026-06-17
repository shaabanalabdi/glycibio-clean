import {productRepository} from "../repository/ProductRepository.js";
import {productImageRepository} from "../repository/ProductImageRepository.js";
import {NotFoundException} from "../error/HttpException.js";

export class ProductController {

    // GET /api/products
    static getProducts = async (req, res, next) => {
        try
        {
            const page = parseInt(req.query.page) || 1
            const limit = parseInt(req.query.limit) || 10
            const { category, ig, search, sort, price_min, price_max, exclude_allergens } = req.query

            const { products, pagination } = await productRepository.findAllFiltered({
                category, ig, search, sort, price_min, price_max, exclude_allergens, page, limit
            })

            // Cache navigateur/proxy court : catalogue semi-statique (anonyme, sans
            // données utilisateur). Les notes/prix se rafraîchissent sous 2 min.
            res.set("Cache-Control", "public, max-age=120")
            return res.status(200).json({
                message: "Products fetched successfully",
                products,
                pagination
            })
        }
        catch (error)
        {
            next(error)
        }
    }

    // GET /api/products/:id  (id numerique OU slug SEO)
    static getProduct = async (req, res, next) => {
        try
        {
            const product = await productRepository.findActiveByIdOrSlug(req.params.id)

            if (!product) {
                throw new NotFoundException("Produit")
            }

            // Images de la galerie (image principale = products.image)
            const gallery = await productImageRepository.findByProduct(product.id)

            res.set("Cache-Control", "public, max-age=120")
            return res.status(200).json({
                message: "Product fetched successfully",
                product: { ...product, gallery }
            })
        }
        catch (error)
        {
            next(error)
        }
    }

    // GET /api/products/:id/related — jusqu'a 4 produits de la meme categorie
    static getRelatedProducts = async (req, res, next) => {
        try
        {
            const current = await productRepository.findActiveByIdOrSlug(req.params.id)

            if (!current) {
                return res.status(200).json({ message: "Related products fetched successfully", products: [] })
            }

            const products = await productRepository.findRelated(current.category_id, current.id)

            res.set("Cache-Control", "public, max-age=300")
            return res.status(200).json({
                message: "Related products fetched successfully",
                products
            })
        }
        catch (error)
        {
            next(error)
        }
    }
}
