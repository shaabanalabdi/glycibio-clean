import * as dotenv from "dotenv"

dotenv.config()

// Validation de l'environnement AVANT tout (avant la creation du pool MySQL via
// App.js). Une config invalide (JWT_SECRET manquant/trop court, vars BDD
// absentes...) coupe le demarrage immediatement plutot que de provoquer des
// erreurs 500 silencieuses en production.
const { Logger } = await import("./services/Logger.js")
const { assertEnv } = await import("./core/env.js")
assertEnv(Logger)

const { app } = await import("./App.js")
const { SentryService } = await import("./services/Sentry.js")
const { abandonedCart } = await import("./cron/abandonedCart.js")
const { expiredCheckout } = await import("./cron/expiredCheckout.js")

await SentryService.init()

// Avertissement de securite : detecte si le compte admin d'usine utilise encore
// le mot de passe par defaut livre dans le dump SQL (hash bcrypt connu).
const warnIfDefaultAdmin = async () => {
    const DEFAULT_ADMIN_HASH = "$2b$12$lywlcGeluaXEhzo2HmgMF..tZWrq238IgM0IpEikGkYKV7ltdpNei"
    try
    {
        const { db } = await import("./core/database.js")
        const [rows] = await db.query(
            "SELECT 1 FROM users WHERE email = 'admin@glycibio.fr' AND password = ? LIMIT 1",
            [DEFAULT_ADMIN_HASH]
        )
        if (rows.length > 0) {
            Logger.warn("[securite] Le compte admin par defaut (admin@glycibio.fr) utilise ENCORE le mot de passe d'usine. Changez-le IMMEDIATEMENT depuis l'espace profil.")
        }
    }
    catch
    {
        // BDD pas encore prete / table absente : on ignore, ce n'est qu'un garde-fou.
    }
}

const PORT = process.env.PORT || 5000

app.listen(PORT, (error) => {
    if (error) {
        console.error("Error starting server:", error.message)
    } else {
        console.log("")
        console.log("=== GlyciBio API v1.5 ===")
        console.log(`Serveur demarre sur http://localhost:${PORT}`)
        console.log(`Health check : http://localhost:${PORT}/api/health`)
        console.log("")
        // En test / CI on desactive les taches planifiees (evite le polling BDD).
        if (process.env.DISABLE_CRON === "1") {
            console.log("[cron] Taches planifiees desactivees (DISABLE_CRON=1)")
        } else {
            abandonedCart.start()
            expiredCheckout.start()
        }

        // Garde-fou securite (asynchrone, non bloquant)
        void warnIfDefaultAdmin()
    }
})
