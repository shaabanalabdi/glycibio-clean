import path from "node:path";
import fs from "node:fs";
import sharp from "sharp";

// Tailles standards pour <img srcset>. La taille "main" est celle stockee
// en BDD (filename sans suffixe). Les autres sont generees a cote du
// fichier principal au format `<base>-<width>.webp`.
const RESPONSIVE_VARIANTS = [480, 1280]
const MAIN_WIDTH = 800
const QUALITY = 80

export class ImageProcessor {

    static RESPONSIVE_VARIANTS = RESPONSIVE_VARIANTS

    static processImage = async (inputPath, outputPath, options = {}) => {
        const { width = MAIN_WIDTH, height = MAIN_WIDTH, quality = QUALITY } = options

        await sharp(inputPath)
            .resize(width, height, { fit: "inside", withoutEnlargement: true })
            .webp({ quality })
            .toFile(outputPath)

        return outputPath
    }

    // /uploads/products/photo.jpg -> /uploads/products/photo.webp
    static getWebpOutputPath = (inputPath) => {
        const dir = path.dirname(inputPath)
        const base = path.basename(inputPath, path.extname(inputPath))
        return path.join(dir, `${base}.webp`)
    }

    // photo.webp -> photo-480.webp
    static getVariantPath = (mainWebpPath, width) => {
        const dir = path.dirname(mainWebpPath)
        const base = path.basename(mainWebpPath, path.extname(mainWebpPath))
        return path.join(dir, `${base}-${width}.webp`)
    }

    // 1) genere la version "main" (URL stockee en BDD) a mainWidth max
    // 2) genere les variantes responsives (jamais d'upscale)
    static processImageWithVariants = async (inputPath, mainOutputPath, options = {}) => {
        const {
            mainWidth = MAIN_WIDTH,
            variants = RESPONSIVE_VARIANTS,
            quality = QUALITY
        } = options

        await sharp(inputPath)
            .resize(mainWidth, mainWidth, { fit: "inside", withoutEnlargement: true })
            .webp({ quality })
            .toFile(mainOutputPath)

        const writtenVariants = []
        for (const width of variants) {
            const variantPath = this.getVariantPath(mainOutputPath, width)
            try
            {
                await sharp(inputPath)
                    .resize(width, width, { fit: "inside", withoutEnlargement: true })
                    .webp({ quality })
                    .toFile(variantPath)
                writtenVariants.push(variantPath)
            }
            catch (_e)
            {
                // Si une variante echoue, le srcset client retombera sur le main.
            }
        }

        return { main: mainOutputPath, variants: writtenVariants }
    }

    // Supprime les variantes d'une image (pas d'orphelins sur disque).
    static cleanupVariants = (mainFilePath) => {
        if (!mainFilePath) return
        const dir = path.dirname(mainFilePath)
        const base = path.basename(mainFilePath, path.extname(mainFilePath))
        for (const width of RESPONSIVE_VARIANTS) {
            const variantPath = path.join(dir, `${base}-${width}.webp`)
            try
            {
                if (fs.existsSync(variantPath)) fs.unlinkSync(variantPath)
            }
            catch
            {
                // ignore
            }
        }
    }
}
