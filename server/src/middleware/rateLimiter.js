import rateLimit from "express-rate-limit";

// En environnement de test (NODE_ENV=test) on desactive le rate-limiting : il
// fausserait les tests d'integration. La protection reste PLEINEMENT active
// en developpement et en production.
const skipInTest = () => process.env.NODE_ENV === "test"

// 100 requetes/minute global
export const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipInTest,
    message: {
        status: 429,
        message: "Trop de requetes. Veuillez reessayer dans une minute."
    }
})

// 5 tentatives/minute pour login/register
export const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipInTest,
    message: {
        status: 429,
        message: "Trop de tentatives. Veuillez reessayer dans une minute."
    }
})

// Formulaire de contact : tres strict (anti-spam), 5 messages/heure par IP
export const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipInTest,
    message: {
        status: 429,
        message: "Trop de messages envoyes. Veuillez reessayer dans une heure."
    }
})

// Routes d'administration : plafond dedie (operations sensibles)
export const adminLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipInTest,
    message: {
        status: 429,
        message: "Trop de requetes admin. Veuillez patienter une minute."
    }
})
