import bcrypt from "bcrypt";
import crypto from "node:crypto";
import {userRepository} from "../repository/UserRepository.js";
import {Validator} from "../services/Validator.js";
import {AuthHelper} from "../services/AuthHelper.js";
import {EmailService} from "../services/EmailService.js";
import {Logger} from "../services/Logger.js";
import {
    ValidationException,
    UnauthorizedException,
    NotFoundException,
    ConflictException,
    TooManyRequestsException
} from "../error/HttpException.js";

// Verrouillage : 5 echecs => compte bloque 15 min
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000

const PASSWORD_MESSAGE = "Le mot de passe doit contenir au moins 12 caracteres dont : 1 minuscule, 1 majuscule, 1 chiffre, 1 caractere special"

const normalizeUsernameBase = (email) => {
    const localPart = (email || "").split("@")[0] || "user"
    const sanitized = localPart
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, "")
        .replace(/^[._-]+|[._-]+$/g, "")
    return (sanitized || "user").slice(0, 90)
}

const generateUniqueUsername = async (email) => {
    const base = normalizeUsernameBase(email)

    for (let attempt = 0; attempt < 20; attempt += 1) {
        const suffix = attempt === 0 ? "" : `_${Math.floor(Math.random() * 90000) + 10000}`
        const candidate = `${base}${suffix}`.slice(0, 100)
        if (!(await userRepository.isUsernameTaken(candidate))) return candidate
    }

    return `user_${Date.now()}`.slice(0, 100)
}

export class AuthController {

    // POST /api/auth/register
    static register = async (req, res, next) => {
        try
        {
            await userRepository.ensureColumns()
            const { email, password, first_name, last_name, newsletter = false } = req.body

            if (!email || !password) {
                throw new ValidationException("Email et password sont obligatoires")
            }

            const errors = {}
            if (!Validator.isEmailValid(email)) errors.email = "Email invalide"
            if (!Validator.isPasswordValid(password)) errors.password = PASSWORD_MESSAGE
            if (!Validator.isNameValid(first_name)) errors.first_name = "Le prenom ne doit pas depasser 100 caracteres"
            if (!Validator.isNameValid(last_name)) errors.last_name = "Le nom ne doit pas depasser 100 caracteres"

            if (Object.keys(errors).length > 0) {
                throw new ValidationException(Object.values(errors).join(", "), errors)
            }

            const existingUser = await userRepository.findOneBy({ email })

            if (existingUser) {
                throw new ConflictException("Cet email est deja utilise")
            }

            const hashedPassword = await bcrypt.hash(password, 12)
            const username = await generateUniqueUsername(email)

            const userId = await userRepository.save({
                username,
                email,
                password: hashedPassword,
                role: "client",
                first_name: first_name || null,
                last_name: last_name || null,
                newsletter_opt_in: newsletter ? 1 : 0,
                newsletter_opt_in_at: newsletter ? new Date() : null
            })

            // Verification email "souple" : le compte est actif immediatement, une
            // banniere invitera a confirmer. Best-effort : un echec SMTP ne bloque
            // pas l'inscription (l'utilisateur pourra renvoyer le lien plus tard).
            try
            {
                const verificationToken = crypto.randomBytes(32).toString("hex")
                const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
                await userRepository.setVerificationToken(userId, verificationToken, verificationExpires)
                await EmailService.sendVerificationEmail(email, verificationToken)
            }
            catch (mailError)
            {
                Logger.warn(`[auth] Envoi email de verification echoue: ${mailError.message}`)
            }

            const token = AuthHelper.signToken({ id: userId, role: "client" })

            // Jeton depose dans un cookie HttpOnly (le `token` du body reste fourni
            // pour la compatibilite ascendante mais n'est plus stocke cote client).
            AuthHelper.setAuthCookie(res, token)

            return res.status(201).json({
                message: "Inscription reussie",
                token,
                user: { id: userId, email, role: "client", first_name: first_name || null, last_name: last_name || null, email_verified: false }
            })
        }
        catch (error)
        {
            next(error)
        }
    }

    // POST /api/auth/login
    static signIn = async (req, res, next) => {
        try
        {
            await userRepository.ensureColumns()
            const { email, password } = req.body

            if (!email || !password) {
                throw new ValidationException("Email et mot de passe sont obligatoires")
            }

            if (!Validator.isEmailValid(email)) {
                throw new ValidationException("Email invalide")
            }

            const user = await userRepository.findOneBy({ email })

            if (!user) {
                throw new UnauthorizedException("Email ou mot de passe incorrect")
            }

            // Compte verrouille ?
            if (user.locked_until && new Date(user.locked_until) > new Date()) {
                const remainingMin = Math.ceil((new Date(user.locked_until) - new Date()) / 60000)
                throw new TooManyRequestsException(`Compte temporairement bloque. Reessayez dans ${remainingMin} minute(s).`)
            }

            const isPasswordValid = await bcrypt.compare(password, user.password)

            if (!isPasswordValid) {
                const nextAttempts = (user.failed_attempts || 0) + 1
                if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
                    const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS)
                    await userRepository.recordFailedAttempt(user.id, nextAttempts, lockedUntil)
                    Logger.warn(`[auth] Compte ${user.email} verrouille (${nextAttempts} echecs)`)
                    throw new TooManyRequestsException("Compte verrouille apres trop de tentatives. Reessayez dans 15 minutes.")
                }
                await userRepository.recordFailedAttempt(user.id, nextAttempts)
                throw new UnauthorizedException("Email ou mot de passe incorrect")
            }

            // Connexion reussie : reset compteur
            if (user.failed_attempts > 0 || user.locked_until) {
                await userRepository.resetLockout(user.id)
            }

            const token = AuthHelper.signToken(user)

            AuthHelper.setAuthCookie(res, token)

            return res.status(200).json({
                message: "Connexion reussie",
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email_verified: !!user.email_verified
                }
            })
        }
        catch (error)
        {
            next(error)
        }
    }

    // GET /api/auth/me
    static getAuthenticatedUser = async (req, res, next) => {
        try
        {
            const user = await userRepository.find(req.user.id)

            if (!user) {
                throw new NotFoundException("Utilisateur")
            }

            return res.status(200).json({
                message: "User fetched successfully",
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    address: user.address,
                    phone: user.phone,
                    email_verified: !!user.email_verified
                }
            })
        }
        catch (error)
        {
            next(error)
        }
    }

    // POST /api/auth/forgot-password
    static forgotPassword = async (req, res, next) => {
        try
        {
            const { email } = req.body

            if (!Validator.isEmailValid(email)) {
                throw new ValidationException("Email invalide")
            }

            const user = await userRepository.findOneBy({ email })

            // Reponse identique que l'utilisateur existe ou non (anti-enumeration)
            if (!user) {
                return res.status(200).json({
                    message: "Si cet email existe, un lien de reinitialisation a ete envoye."
                })
            }

            const token = crypto.randomBytes(32).toString("hex")
            const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 heure

            await userRepository.setResetToken(user.id, token, expires)

            await EmailService.sendPasswordResetEmail(user.email, token)

            return res.status(200).json({
                message: "Si cet email existe, un lien de reinitialisation a ete envoye."
            })
        }
        catch (error)
        {
            next(error)
        }
    }

    // POST /api/auth/reset-password
    static resetPassword = async (req, res, next) => {
        try
        {
            const { token, new_password } = req.body

            if (!token || !new_password) {
                throw new ValidationException("Token et nouveau mot de passe sont obligatoires")
            }

            if (!Validator.isPasswordValid(new_password)) {
                throw new ValidationException(PASSWORD_MESSAGE)
            }

            const user = await userRepository.findByValidResetToken(token)

            if (!user) {
                throw new ValidationException("Lien invalide ou expire. Veuillez refaire une demande.")
            }

            const hashedPassword = await bcrypt.hash(new_password, 12)

            await userRepository.resetPasswordAndInvalidateTokens(user.id, hashedPassword)

            return res.status(200).json({
                message: "Mot de passe reinitialise avec succes. Vous pouvez maintenant vous connecter."
            })
        }
        catch (error)
        {
            next(error)
        }
    }

    // POST /api/auth/logout
    static signOut = async (req, res, next) => {
        try
        {
            AuthHelper.clearAuthCookie(res)
            return res.status(200).json({ message: "Deconnexion reussie" })
        }
        catch (error)
        {
            next(error)
        }
    }

    // POST /api/auth/verify-email
    static verifyEmail = async (req, res, next) => {
        try
        {
            const { token } = req.body

            if (!token) {
                throw new ValidationException("Token de verification manquant")
            }

            const user = await userRepository.findByValidVerificationToken(token)

            if (!user) {
                throw new ValidationException("Lien de verification invalide ou expire. Demandez un nouveau lien.")
            }

            await userRepository.markEmailVerified(user.id)

            return res.status(200).json({
                message: "Adresse email confirmee avec succes."
            })
        }
        catch (error)
        {
            next(error)
        }
    }

    // POST /api/auth/resend-verification (authentifie)
    static resendVerification = async (req, res, next) => {
        try
        {
            const user = await userRepository.find(req.user.id)

            if (!user) {
                throw new NotFoundException("Utilisateur")
            }

            if (user.email_verified) {
                return res.status(200).json({
                    message: "Votre adresse email est deja confirmee."
                })
            }

            const verificationToken = crypto.randomBytes(32).toString("hex")
            const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

            await userRepository.setVerificationToken(user.id, verificationToken, verificationExpires)
            await EmailService.sendVerificationEmail(user.email, verificationToken)

            return res.status(200).json({
                message: "Un nouveau lien de confirmation vous a ete envoye."
            })
        }
        catch (error)
        {
            next(error)
        }
    }
}
