import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import {fileURLToPath} from "node:url";
import {FileSignature} from "../services/FileSignature.js";
import {ValidationException} from "../error/HttpException.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Dossier de destination des uploads
const UPLOAD_DIR = path.join(__dirname, "../../uploads/products")
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR)
    },
    filename: (req, file, cb) => {
        // Nom unique : timestamp + suffixe aleatoire
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
        const ext = path.extname(file.originalname).toLowerCase()
        cb(null, `product-${uniqueSuffix}${ext}`)
    }
})

const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error("Type de fichier non autorise. Formats acceptes : JPEG, PNG, WebP"), false)
    }
}

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB max
    }
})

const uploadProductImage = upload.single("image")

// Lit les 12 premiers octets du fichier ecrit sur disque par multer.
const readHeaderBytes = (filePath) => {
    let fd
    try
    {
        fd = fs.openSync(filePath, "r")
        const header = Buffer.alloc(12)
        fs.readSync(fd, header, 0, 12, 0)
        return header
    }
    catch
    {
        return Buffer.alloc(0)
    }
    finally
    {
        if (fd !== undefined) {
            try { fs.closeSync(fd) } catch { /* deja ferme */ }
        }
    }
}

// Wrapper avec gestion d'erreur + validation des magic bytes : le mimetype et
// l'extension declares par le client sont falsifiables. Si le fichier ecrit
// par multer n'est pas une vraie image autorisee, on le supprime et on refuse.
export const handleUpload = (req, res, next) => {
    uploadProductImage(req, res, (err) => {
        if (err) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return next(new ValidationException("Fichier trop volumineux. Taille maximale : 5 MB"))
            }
            return next(new ValidationException(err.message || "Erreur lors de l'upload"))
        }

        if (req.file && req.file.path) {
            if (!FileSignature.isAllowedImage(readHeaderBytes(req.file.path))) {
                try { fs.unlinkSync(req.file.path) } catch { /* deja absent */ }
                return next(new ValidationException("Fichier invalide : le contenu n'est pas une image JPEG, PNG ou WebP."))
            }
        }

        next()
    })
}
