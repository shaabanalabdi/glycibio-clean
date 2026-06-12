import {AuthHelper} from "../services/AuthHelper.js";
import {userRepository} from "../repository/UserRepository.js";
import {UnauthorizedException} from "../error/HttpException.js";
import {Logger} from "../services/Logger.js";

// Verifie le token JWT (+ fraicheur de session).
// Le jeton est lu depuis le cookie HttpOnly `token` OU, pour la
// compatibilite, depuis l'en-tete Authorization Bearer.
export const isAuthenticated = async (req, res, next) => {
    const token = AuthHelper.getTokenFromRequest(req)

    if (!token) {
        return next(new UnauthorizedException("Token manquant. Veuillez vous connecter."))
    }

    let decoded
    try
    {
        decoded = AuthHelper.verifyToken(token)
    }
    catch (error)
    {
        return next(new UnauthorizedException("Token invalide ou expire. Veuillez vous reconnecter."))
    }

    req.user = {
        id: decoded.id,
        role: decoded.role
    }

    // Invalidation de session : si l'utilisateur a reinitialise son mot de
    // passe (users.tokens_valid_after), tout jeton emis AVANT cette date est
    // rejete. Fail-open : un incident BDD ne doit pas casser l'authentification.
    try
    {
        const validAfter = await userRepository.getTokensValidAfter(decoded.id)
        if (validAfter && typeof decoded.iat === "number" &&
            decoded.iat * 1000 < new Date(validAfter).getTime()) {
            return next(new UnauthorizedException("Session expiree (mot de passe modifie). Veuillez vous reconnecter."))
        }
    }
    catch (freshnessErr)
    {
        Logger.warn("[isAuthenticated] Verification de fraicheur ignoree:", { msg: freshnessErr.message })
    }

    next()
}
