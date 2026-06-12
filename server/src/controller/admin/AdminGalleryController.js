import path from "node:path";
import fs from "node:fs";
import {fileURLToPath} from "node:url";
import {productImageRepository} from "../../repository/ProductImageRepository.js";
import {ImageProcessor} from "../../services/ImageProcessor.js";
import {Logger} from "../../services/Logger.js";
import {Validator} from "../../services/Validator.js";
import {ValidationException, NotFoundException} from "../../error/HttpException.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOAD_DIR = path.join(__dirname, "../../../uploads/products")

const processToWebp = async (file) => {
    if (!file) return null
    const inputPath = file.path
    const outputPath = ImageProcessor.getWebpOutputPath(inputPath)
    try
    {
        // Gallery main = 1280 (haute resolution pour zoom/lightbox)
        await ImageProcessor.processImageWithVariants(inputPath, outputPath, {
            mainWidth: 1280,
            variants: [480, 800],
            quality: 82
        })
        if (outputPath !== inputPath && fs.existsSync(inputPath)) {
            fs.unlinkSync(inputPath)
        }
        return `/uploads/products/${path.basename(outputPath)}`
    }
    catch (err)
    {
        Logger.warn("Image gallery process fallback", { msg: err.message })
        return `/uploads/products/${file.filename}`
    }
}

export class AdminGalleryController {

    // GET /api/admin/products/:id/images
    static getGallery = async (req, res, next) => {
        try
        {
            const images = await productImageRepository.findByProduct(req.params.id)

            return res.status(200).json({
                message: "Gallery fetched successfully",
                images
            })
        }
        catch (error)
        {
            next(error)
        }
    }

    // POST /api/admin/products/:id/images  (multipart: image, alt?)
    static addImage = async (req, res, next) => {
        try
        {
            const productId = parseInt(req.params.id, 10)
            if (!Validator.isIdValid(productId)) {
                throw new ValidationException("ID invalide")
            }

            const url = await processToWebp(req.file)
            if (!url) {
                throw new ValidationException("Image requise")
            }

            const alt = req.body.alt ? String(req.body.alt).slice(0, 255) : null

            const maxPosition = await productImageRepository.maxPosition(productId)
            const position = maxPosition + 1

            const imageId = await productImageRepository.save({
                product_id: productId,
                url,
                alt,
                position
            })

            return res.status(201).json({
                message: "Image ajoutee avec succes",
                image: { id: imageId, url, alt, position }
            })
        }
        catch (error)
        {
            next(error)
        }
    }

    // DELETE /api/admin/products/:productId/images/:imageId
    static deleteImage = async (req, res, next) => {
        try
        {
            const image = await productImageRepository.findOneForProduct(req.params.imageId, req.params.productId)

            if (!image) {
                throw new NotFoundException("Image")
            }

            await productImageRepository.delete(req.params.imageId)

            // Best-effort : retirer le fichier physique s'il n'est plus reference
            const url = image.url
            if (url && url.startsWith("/uploads/products/")) {
                const stillUsed = await productImageRepository.isUrlStillUsed(url)
                if (!stillUsed) {
                    const filePath = path.join(UPLOAD_DIR, path.basename(url))
                    try
                    {
                        if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
                        ImageProcessor.cleanupVariants(filePath)
                    }
                    catch (_e)
                    {
                        // ignore
                    }
                }
            }

            return res.status(200).json({ message: "Image supprimee" })
        }
        catch (error)
        {
            next(error)
        }
    }
}
