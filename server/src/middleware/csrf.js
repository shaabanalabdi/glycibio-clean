import crypto from "node:crypto"

// ============================================================
// Protection CSRF — patron "double-submit cookie".
//
// Principe : le serveur depose un jeton aleatoire dans un cookie LISIBLE par le
// JS (csrf_token, NON httpOnly). Le front le relit et le renvoie dans l'en-tete
// X-CSRF-Token sur toute requete mutante (POST/PUT/PATCH/DELETE). Le serveur
// verifie header === cookie.
//
// Pourquoi ca bloque la CSRF : un site attaquant peut declencher une requete
// cross-site (le cookie d'auth partira), mais il NE PEUT NI lire le cookie CSRF
// de la victime (same-origin policy) NI poser l'en-tete custom cross-origin sans
// autorisation CORS. Il ne peut donc pas faire matcher header et cookie.
// Complement (defense en profondeur) du cookie d'auth SameSite=lax.
// ============================================================
const CSRF_COOKIE = "csrf_token"
const CSRF_HEADER = "x-csrf-token"
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"])

const csrfCookieOptions = () => ({
    httpOnly: false, // DOIT etre lisible par le JS du front (sinon double-submit impossible)
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
})

// Comparaison a temps constant (evite une fuite par timing). Renvoie false si
// longueurs differentes ou entrees absentes.
const safeEqual = (a, b) => {
    if (typeof a !== "string" || typeof b !== "string") return false
    const bufA = Buffer.from(a)
    const bufB = Buffer.from(b)
    if (bufA.length !== bufB.length) return false
    return crypto.timingSafeEqual(bufA, bufB)
}

export const csrfProtection = (req, res, next) => {
    let token = req.cookies?.[CSRF_COOKIE]

    // Emet un jeton s'il n'existe pas encore (sur n'importe quelle requete, y
    // compris les GET de chargement de la SPA -> le cookie est pose avant le 1er POST).
    if (!token) {
        token = crypto.randomBytes(32).toString("hex")
        res.cookie(CSRF_COOKIE, token, csrfCookieOptions())
    }

    // Methodes non mutantes : rien a verifier.
    if (SAFE_METHODS.has(req.method)) return next()

    // Methodes mutantes : l'en-tete doit egaler le cookie.
    const header = req.headers[CSRF_HEADER]
    if (!safeEqual(header, token)) {
        return res.status(403).json({
            status: 403,
            message: "Jeton CSRF manquant ou invalide. Rechargez la page puis reessayez.",
            path: req.path,
            timestamp: new Date().toISOString()
        })
    }

    next()
}
