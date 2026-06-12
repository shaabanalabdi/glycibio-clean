import {ForbiddenException, UnauthorizedException} from "../error/HttpException.js";

// S'utilise APRES isAuthenticated : routes.use("/admin/...", isAuthenticated, isAdmin, ...)
export const isAdmin = (req, res, next) => {
    if (!req.user) {
        return next(new UnauthorizedException("Non authentifie. Veuillez vous connecter."))
    }

    if (req.user.role !== "admin") {
        return next(new ForbiddenException("Acces refuse. Droits administrateur requis."))
    }

    next()
}
