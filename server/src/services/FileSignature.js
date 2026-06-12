// Detecte le vrai type d'une image d'apres sa signature binaire (magic bytes),
// independamment de l'extension ou du Content-Type — tous deux falsifiables.
// Sert a refuser un fichier malveillant deguise en image.

export class FileSignature {

    static ALLOWED_IMAGE_TYPES = ["jpeg", "png", "webp"]

    // Renvoie 'jpeg' | 'png' | 'webp' si le buffer commence par la signature
    // correspondante, sinon null.
    static detectImageType = (buf) => {
        if (!Buffer.isBuffer(buf) || buf.length < 12) return null

        // JPEG : FF D8 FF
        if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg"

        // PNG : 89 50 4E 47 0D 0A 1A 0A
        if (
            buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
            buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
        ) return "png"

        // WebP : "RIFF" (0-3) .... "WEBP" (8-11)
        if (
            buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
            buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
        ) return "webp"

        return null
    }

    static isAllowedImage = (buf) => {
        return this.ALLOWED_IMAGE_TYPES.includes(this.detectImageType(buf))
    }
}
