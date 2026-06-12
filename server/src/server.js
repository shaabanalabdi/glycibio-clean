import * as dotenv from "dotenv"

dotenv.config()

const { app } = await import("./App.js")
const { SentryService } = await import("./services/Sentry.js")
const { abandonedCart } = await import("./cron/abandonedCart.js")
const { expiredCheckout } = await import("./cron/expiredCheckout.js")

await SentryService.init()

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
    }
})
