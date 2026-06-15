// ============================================================
// Validation des variables d'environnement au DEMARRAGE (fail-fast).
//
// Objectif : transformer une mauvaise configuration silencieuse (qui ne se
// manifesterait que par des erreurs 500 en production) en une erreur immediate,
// explicite, AVANT que le serveur n'accepte du trafic.
//
// `validateEnv` est PURE (prend l'environnement en parametre) -> testable
// unitairement sans toucher a process.env ni demarrer le serveur.
// ============================================================

const MIN_JWT_SECRET_LENGTH = 32

// Regroupe les problemes en deux niveaux : `errors` (fatals -> on refuse de
// demarrer) et `warnings` (non bloquants -> on logge seulement).
export const validateEnv = (env = process.env) => {
    const errors = []
    const warnings = []

    const isProd = env.NODE_ENV === "production"

    // En PRODUCTION, ces manques sont FATAUX (on refuse de demarrer pour eviter
    // un deploiement casse). En DEVELOPPEMENT, ce ne sont que des
    // AVERTISSEMENTS : on laisse le serveur demarrer (travail front, code
    // hors-BDD...) ; les appels qui en ont besoin echoueront avec un message
    // clair. La protection de la prod reste entiere.
    const requireVar = (present, message) => {
        if (present) return
        if (isProd) errors.push(message)
        else warnings.push(message)
    }

    // --- Base de donnees ---
    for (const key of ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"]) {
        requireVar(
            env[key] && String(env[key]).trim() !== "",
            `${key} manquant : la connexion MySQL echouera (renseignez server/.env).`
        )
    }

    // --- Secret JWT ---
    requireVar(
        env.JWT_SECRET && String(env.JWT_SECRET).trim() !== "",
        "JWT_SECRET manquant : l'authentification echouera (renseignez server/.env)."
    )
    if (env.JWT_SECRET && String(env.JWT_SECRET).length < MIN_JWT_SECRET_LENGTH) {
        requireVar(false, `JWT_SECRET trop court (${env.JWT_SECRET.length} car.) : minimum ${MIN_JWT_SECRET_LENGTH} pour resister au bruteforce hors-ligne.`)
    }

    // --- Garde-fous propres a la production ---
    if (isProd) {
        if (!env.CORS_ORIGIN || String(env.CORS_ORIGIN).trim() === "") {
            errors.push("CORS_ORIGIN manquant en production : aucune origine front ne serait autorisee.")
        }
        // Si Stripe est active, le secret de webhook est OBLIGATOIRE (sinon un
        // webhook non signe pourrait marquer une commande payee).
        const stripeKey = env.STRIPE_SECRET_KEY || ""
        const stripeOn = stripeKey && !stripeKey.includes("placeholder")
        if (stripeOn && !env.STRIPE_WEBHOOK_SECRET) {
            errors.push("STRIPE_WEBHOOK_SECRET manquant alors que Stripe est configure : les webhooks de paiement seraient rejetes (503).")
        }
        if (!env.SENTRY_DSN) {
            warnings.push("SENTRY_DSN absent en production : le suivi des erreurs (Sentry) est desactive.")
        }
    } else {
        warnings.push("NODE_ENV != production : mode developpement (cookies non-Secure, CORS localhost autorise).")
    }

    return { ok: errors.length === 0, errors, warnings }
}

// Applique la validation et coupe le process si une erreur fatale est presente.
// `logger` est injecte (testabilite / pas de dependance dure a Logger).
export const assertEnv = (logger = console, env = process.env) => {
    const { ok, errors, warnings } = validateEnv(env)
    const warn = (msg) => (logger.warn ? logger.warn(msg) : console.warn(msg))
    const error = (msg) => (logger.error ? logger.error(msg) : console.error(msg))

    warnings.forEach((w) => warn(`[env] ${w}`))

    if (!ok) {
        errors.forEach((e) => error(`[env] FATAL: ${e}`))
        error("[env] Demarrage interrompu : corrigez la configuration (.env) ci-dessus.")
        process.exit(1)
    }

    return true
}
