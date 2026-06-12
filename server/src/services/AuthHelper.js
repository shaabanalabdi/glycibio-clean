import jwt from "jsonwebtoken";
import * as dotenv from "dotenv";

dotenv.config();

// Jeton JWT depose dans un cookie HttpOnly :
//   - HttpOnly : invisible cote JS (immunite contre le vol de token par XSS)
//   - Secure   : uniquement en HTTPS en production
//   - SameSite : 'lax' par defaut (protection CSRF sur les requetes non-GET)
// Compatibilite : le jeton est AUSSI accepte via l'en-tete Authorization Bearer.
const COOKIE_NAME = "token"
const MAX_AGE_MS = 24 * 60 * 60 * 1000

const cookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.COOKIE_SAMESITE || "lax",
    maxAge: MAX_AGE_MS,
    path: "/"
})

export class AuthHelper {

    static COOKIE_NAME = COOKIE_NAME

    static getTokenFromRequest(req) {
        const authHeader = req.headers.authorization
        if (authHeader && authHeader.startsWith("Bearer ")) {
            return authHeader.slice("Bearer ".length)
        }

        if (req.cookies && req.cookies[COOKIE_NAME]) {
            return req.cookies[COOKIE_NAME]
        }

        // Fallback : cookie brut si cookie-parser n'est pas passe (tests)
        const rawCookie = req.headers.cookie
        if (rawCookie) {
            const target = `${COOKIE_NAME}=`
            const found = rawCookie
                .split(";")
                .map((c) => c.trim())
                .find((c) => c.startsWith(target))
            if (found) return decodeURIComponent(found.slice(target.length))
        }

        return null
    }

    static signToken(user) {
        return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || "24h",
            algorithm: process.env.JWT_ALGO || "HS256"
        })
    }

    static verifyToken(token) {
        return jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: [process.env.JWT_ALGO || "HS256"]
        })
    }

    static setAuthCookie(res, token) {
        res.cookie(COOKIE_NAME, token, cookieOptions())
    }

    static clearAuthCookie(res) {
        const options = { ...cookieOptions() }
        delete options.maxAge
        res.clearCookie(COOKIE_NAME, options)
    }
}
