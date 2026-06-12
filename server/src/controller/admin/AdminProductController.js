import path from "node:path";
import fs from "node:fs";
import {productRepository} from "../../repository/ProductRepository.js";
import {categoryRepository} from "../../repository/CategoryRepository.js";
import {ImageProcessor} from "../../services/ImageProcessor.js";
import {Slug} from "../../services/Slug.js";
import {Validator} from "../../services/Validator.js";
import {ValidationException, NotFoundException, ConflictException} from "../../error/HttpException.js";

const processUploadedImage = async (req) => {
    if (!req.file) {
        const value = typeof req.body.image === "string" ? req.body.image.trim() : ""
        return value || null
    }

    const inputPath = req.file.path
    const outputPath = ImageProcessor.getWebpOutputPath(inputPath)

    try
    {
        // Genere le main (800) + variantes responsives (480, 1280)
        await ImageProcessor.processImageWithVariants(inputPath, outputPath)
        if (inputPath !== outputPath && fs.existsSync(inputPath)) {
            fs.unlinkSync(inputPath)
        }
        return `/uploads/products/${path.basename(outputPath)}`
    }
    catch
    {
        // Si sharp echoue, garder le fichier original (pas de variantes)
        return `/uploads/products/${req.file.filename}`
    }
}

const parseJsonField = (value, fallback) => {
    if (value === null || value === undefined || value === "") return fallback
    if (typeof value === "object") return value
    if (typeof value !== "string") return fallback

    try
    {
        return JSON.parse(value)
    }
    catch
    {
        return fallback
    }
}

const parseOptionalNumber = (value) => {
    if (value === undefined || value === null || value === "") return null
    const parsed = Number(value)
    return Number.isNaN(parsed) ? null : parsed
}

const parseOptionalBoolean = (value) => {
    if (value === undefined || value === null || value === "") return null
    if (typeof value === "boolean") return value
    if (typeof value === "string") {
        const normalized = value.toLowerCase()
        if (normalized === "true" || normalized === "1") return true
        if (normalized === "false" || normalized === "0") return false
    }
    return null
}

const normalizeAllergens = (allergens) => {
    const parsed = parseJsonField(allergens, allergens)
    return Array.isArray(parsed)
        ? parsed.filter((item) => typeof item === "string" && item.trim() !== "")
        : null
}

const normalizeNutrition = (nutritionalInfo) => {
    const parsed = parseJsonField(nutritionalInfo, nutritionalInfo)
    return (parsed && typeof parsed === "object" && !Array.isArray(parsed)) ? parsed : null
}

export class AdminProductController {

    // GET /api/admin/products
    static getProducts = async (req, res, next) => {
        try
        {
            const { search, category, status } = req.query

            const rows = await productRepository.findAllForAdmin({ search, category, status })

            const products = rows.map((row) => ({
                ...row,
                allergens: parseJsonField(row.allergens, []),
                nutritional_info: parseJsonField(row.nutritional_info, null)
            }))

            return res.status(200).json({
                message: "Products fetched successfully",
                products
            })
        }
        catch (error)
        {
            next(error)
        }
    }

    // GET /api/admin/products/:id
    static getProduct = async (req, res, next) => {
        try
        {
            const product = await productRepository.findByIdAdmin(req.params.id)

            if (!product) {
                throw new NotFoundException("Produit")
            }

            return res.status(200).json({
                message: "Product fetched successfully",
                product: {
                    ...product,
                    allergens: parseJsonField(product.allergens, []),
                    nutritional_info: parseJsonField(product.nutritional_info, null)
                }
            })
        }
        catch (error)
        {
            next(error)
        }
    }

    // POST /api/admin/products
    static createProduct = async (req, res, next) => {
        try
        {
            const {
                name, description, price, stock,
                glycemic_index, allergens, nutritional_info, category_id
            } = req.body

            const errors = {}
            if (!Validator.isStringLengthValid(name || "", 2, 200)) errors.name = "Le nom du produit est obligatoire (2 a 200 caracteres)"
            if (!description || String(description).trim().length < 10) errors.description = "La description est obligatoire (10 caracteres minimum)"
            if (!Validator.isPriceValid(price)) errors.price = "Le prix est obligatoire et doit etre positif"
            if (stock !== undefined && stock !== null && stock !== "" && !Validator.isStockValid(parseOptionalNumber(stock))) errors.stock = "Le stock doit etre un entier >= 0"
            if (!Validator.isGlycemicIndexValid(glycemic_index)) errors.glycemic_index = "L'indice glycemique doit etre entre 0 et 110"
            if (!Validator.isJsonOrArray(allergens)) errors.allergens = "allergens doit etre un tableau ou une chaine JSON"
            if (!Validator.isJsonOrArray(nutritional_info)) errors.nutritional_info = "nutritional_info doit etre un objet ou une chaine JSON"
            if (!Validator.isIdValid(category_id)) errors.category_id = "La categorie est obligatoire"

            if (Object.keys(errors).length > 0) {
                throw new ValidationException(Object.values(errors).join(", "), errors)
            }

            const category = await categoryRepository.find(category_id)

            if (!category) {
                throw new NotFoundException("Categorie")
            }

            const normalizedAllergens = normalizeAllergens(allergens)
            const normalizedNutrition = normalizeNutrition(nutritional_info)
            const normalizedImage = await processUploadedImage(req)

            const productId = await productRepository.save({
                name,
                description,
                price: Number(price),
                image: normalizedImage,
                stock: parseOptionalNumber(stock) ?? 0,
                glycemic_index: parseOptionalNumber(glycemic_index),
                allergens: normalizedAllergens ? JSON.stringify(normalizedAllergens) : null,
                nutritional_info: normalizedNutrition ? JSON.stringify(normalizedNutrition) : null,
                category_id: Number(category_id)
            })

            // Generer et stocker le slug (apres insert pour avoir l'id)
            const slug = Slug.productSlug(name, productId)
            await productRepository.updateSlug(productId, slug)

            return res.status(201).json({
                message: "Produit cree avec succes",
                product: { id: productId, slug }
            })
        }
        catch (error)
        {
            next(error)
        }
    }

    // PUT /api/admin/products/:id
    static updateProduct = async (req, res, next) => {
        try
        {
            const {
                name, description, price, stock,
                glycemic_index, allergens, nutritional_info, category_id, is_active
            } = req.body

            const errors = {}
            if (name !== undefined && !Validator.isStringLengthValid(name, 2, 200)) errors.name = "Le nom doit contenir entre 2 et 200 caracteres"
            if (description !== undefined && String(description).trim().length < 10) errors.description = "La description doit contenir au moins 10 caracteres"
            if (price !== undefined && !Validator.isPriceValid(price)) errors.price = "Le prix doit etre positif"
            if (stock !== undefined && stock !== "" && !Validator.isStockValid(parseOptionalNumber(stock))) errors.stock = "Le stock doit etre un entier >= 0"
            if (!Validator.isGlycemicIndexValid(glycemic_index)) errors.glycemic_index = "L'indice glycemique doit etre entre 0 et 110"
            if (!Validator.isJsonOrArray(allergens)) errors.allergens = "allergens doit etre un tableau ou une chaine JSON"
            if (!Validator.isJsonOrArray(nutritional_info)) errors.nutritional_info = "nutritional_info doit etre un objet ou une chaine JSON"
            if (category_id !== undefined && !Validator.isIdValid(category_id)) errors.category_id = "category_id invalide"

            if (Object.keys(errors).length > 0) {
                throw new ValidationException(Object.values(errors).join(", "), errors)
            }

            const existing = await productRepository.find(req.params.id)

            if (!existing) {
                throw new NotFoundException("Produit")
            }

            const normalizedAllergens = normalizeAllergens(allergens)
            const normalizedNutrition = normalizeNutrition(nutritional_info)
            const normalizedImage = await processUploadedImage(req)

            await productRepository.updatePartial(req.params.id, {
                name: name || null,
                description: description || null,
                price: price !== undefined ? parseOptionalNumber(price) : null,
                image: normalizedImage,
                stock: stock !== undefined ? parseOptionalNumber(stock) : null,
                glycemic_index: glycemic_index !== undefined ? parseOptionalNumber(glycemic_index) : null,
                allergens: allergens !== undefined ? JSON.stringify(normalizedAllergens || []) : null,
                nutritional_info: nutritional_info !== undefined ? JSON.stringify(normalizedNutrition || {}) : null,
                category_id: category_id !== undefined ? parseOptionalNumber(category_id) : null,
                is_active: is_active !== undefined ? parseOptionalBoolean(is_active) : null
            })

            // Si le nom a change, regenerer le slug pour rester SEO-friendly
            if (name) {
                const newSlug = Slug.productSlug(name, req.params.id)
                await productRepository.updateSlug(req.params.id, newSlug)
            }

            return res.status(200).json({ message: "Produit mis a jour" })
        }
        catch (error)
        {
            next(error)
        }
    }

    // DELETE /api/admin/products/:id (soft delete)
    static deleteProduct = async (req, res, next) => {
        try
        {
            const deleted = await productRepository.softDelete(req.params.id)

            if (!deleted) {
                throw new NotFoundException("Produit")
            }

            return res.status(200).json({ message: "Produit desactive" })
        }
        catch (error)
        {
            next(error)
        }
    }

    // DELETE /api/admin/products/:id/permanent (hard delete)
    static permanentDeleteProduct = async (req, res, next) => {
        try
        {
            const refs = await productRepository.countOrderReferences(req.params.id)

            if (refs > 0) {
                throw new ConflictException("Impossible de supprimer : ce produit est lie a des commandes. Desactivez-le a la place.")
            }

            const deleted = await productRepository.hardDelete(req.params.id)

            if (!deleted) {
                throw new NotFoundException("Produit")
            }

            return res.status(200).json({ message: "Produit supprime definitivement" })
        }
        catch (error)
        {
            next(error)
        }
    }
}
