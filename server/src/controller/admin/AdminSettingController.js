import path from "node:path";
import fs from "node:fs";
import {fileURLToPath} from "node:url";
import {settingRepository} from "../../repository/SettingRepository.js";
import {ImageProcessor} from "../../services/ImageProcessor.js";
import {Logger} from "../../services/Logger.js";
import {ValidationException} from "../../error/HttpException.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOAD_DIR = path.join(__dirname, "../../../uploads/products")

// Supprime un fichier uploade + ses variantes (best-effort).
const removeUpload = (url) => {
    if (!url || !url.startsWith("/uploads/products/")) return
    try
    {
        const filePath = path.join(UPLOAD_DIR, path.basename(url))
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
        ImageProcessor.cleanupVariants(filePath)
    }
    catch
    {
        // ignore
    }
}

// Convertit l'upload en UN SEUL WebP large (banniere plein largeur). Pas de
// variantes responsives : le hero utilise l'image en background-image via une
// URL unique -> generer des variantes serait inutile (et laisserait des
// orphelins, cleanupVariants ne connaissant que les largeurs par defaut).
const processHeroImage = async (file) => {
    if (!file) return null
    const inputPath = file.path
    const outputPath = ImageProcessor.getWebpOutputPath(inputPath)
    try
    {
        await ImageProcessor.processImage(inputPath, outputPath, { width: 1920, height: 1920, quality: 80 })
        if (outputPath !== inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
        return `/uploads/products/${path.basename(outputPath)}`
    }
    catch (err)
    {
        Logger.warn("[AdminSetting] Traitement image hero en repli", { msg: err.message })
        return `/uploads/products/${file.filename}`
    }
}

export class AdminSettingController {

    // PUT /api/admin/settings/hero-background  (multipart: image)
    static updateHeroBackground = async (req, res, next) => {
        try
        {
            const url = await processHeroImage(req.file)
            if (!url) throw new ValidationException("Image requise")

            const previous = await settingRepository.get("hero_background")
            await settingRepository.set("hero_background", url)

            // Nettoyage de l'ancienne image (best-effort)
            if (previous && previous !== url) removeUpload(previous)

            return res.status(200).json({ message: "Image de fond mise a jour", hero_background: url })
        }
        catch (error)
        {
            next(error)
        }
    }

    // DELETE /api/admin/settings/hero-background — repli sur le degrade par defaut
    static resetHeroBackground = async (req, res, next) => {
        try
        {
            const previous = await settingRepository.get("hero_background")
            await settingRepository.set("hero_background", null)
            removeUpload(previous)
            return res.status(200).json({ message: "Image de fond reinitialisee" })
        }
        catch (error)
        {
            next(error)
        }
    }
}
