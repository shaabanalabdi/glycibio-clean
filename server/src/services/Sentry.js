import {Logger} from "./Logger.js";

// Sentry — initialisation conditionnelle (no-op si DSN absent).
// Active uniquement si SENTRY_DSN est defini ET le paquet est installe.
let Sentry = null
let initialized = false

export class SentryService {

    static init = async () => {
        if (initialized) return Sentry
        initialized = true

        if (!process.env.SENTRY_DSN) {
            Logger.info("Sentry desactive (SENTRY_DSN absent)")
            return null
        }

        try
        {
            Sentry = await import("@sentry/node")
            Sentry.init({
                dsn: process.env.SENTRY_DSN,
                environment: process.env.NODE_ENV || "development",
                tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_RATE || "0.1"),
                release: process.env.APP_VERSION
            })
            Logger.info("Sentry initialise")
            return Sentry
        }
        catch (err)
        {
            Logger.warn("Sentry non disponible : paquet @sentry/node non installe", { msg: err.message })
            Sentry = null
            return null
        }
    }

    static captureException = (err, ctx) => {
        if (Sentry) Sentry.captureException(err, ctx ? { extra: ctx } : undefined)
    }
}
