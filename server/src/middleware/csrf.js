import crypto from "node:crypto"
import {Logger} from "../services/Logger.js"

// ============================================================
// Protection CSRF — patron "double-submit cookie".
//
// Principe : le serveur depose un jeton aleatoire dans un cookie LISIBLE par le
// JS (csrf_token, NON httpOnly). Le front le relit et le renvoie dans l'en-tete
// X-CSRF-Token sur toute requete mutante (POST/PUT/PATCH/DELETE). Le serveur
// verifie que l'en-tete correspond au cookie.
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

// Recupere TOUTES les valeurs csrf_token de l'en-tete Cookie brut. Indispensable :
// le navigateur peut detenir PLUSIEURS cookies csrf_token (ex. une ancienne version
// non-Secure + une nouvelle Secure apres passage en production, ou des chemins
// differents). cookie-parser n'en expose qu'UNE, qui peut differer de celle que le
// front a relue et renvoyee dans l'en-tete -> faux 403. En comparant a l'ensemble
// des valeurs, on tolere ces doublons sans affaiblir la securite (l'attaquant ne
// peut toujours ni lire ces cookies ni poser l'en-tete cross-origin).
const readCsrfCookies = (req) => {
    const raw = req.headers.cookie || ""
    return raw.split(";")
        .map((c) => c.trim())
        .filter((c) => c.startsWith(CSRF_COOKIE + "="))
        .map((c) => c.slice(CSRF_COOKIE.length + 1))
        .filter(Boolean)
}

export const csrfProtection = (req, res, next) => {
    const cookieValues = readCsrfCookies(req)

    // Aucun cookie CSRF : on en emet un (sur n'importe quelle requete, GET inclus,
    // pour qu'il soit pose avant le 1er POST) et on l'utilise comme reference ici.
    if (cookieValues.length === 0) {
        const token = crypto.randomBytes(32).toString("hex")
        res.cookie(CSRF_COOKIE, token, csrfCookieOptions())
        cookieValues.push(token)
    }

    // Methodes non mutantes : rien a verifier.
    if (SAFE_METHODS.has(req.method)) return next()

    // Methodes mutantes : l'en-tete doit egaler L'UNE des valeurs du cookie.
    const header = req.headers[CSRF_HEADER]
    if (!cookieValues.some((value) => safeEqual(header, value))) {
        Logger.warn(`[csrf] 403 ${req.method} ${req.path} — header:${header ? "present" : "absent"} cookies:${cookieValues.length}`)
        return res.status(403).json({
            status: 403,
            message: "Jeton CSRF manquant ou invalide. Rechargez la page puis reessayez.",
            path: req.path,
            timestamp: new Date().toISOString()
        })
    }

    next()
}
