// Cron : filet de securite pour les commandes "en_attente" orphelines.
// Stripe n'envoie pas toujours checkout.session.expired (panne, mauvais
// secret...). Toutes les 30 min : commandes en_attente de plus de 48h
// -> annulation + restauration du stock.
// Desactivation : process.env.DISABLE_CRON=1
import {db} from "../core/database.js";
import {orderRepository} from "../repository/OrderRepository.js";
import {Logger} from "../services/Logger.js";

const TICK_MS = 30 * 60 * 1000
const EXPIRE_AFTER_HOURS = 48

const runOnce = async () => {
    try
    {
        const [orders] = await db.query(
            `SELECT id FROM orders
              WHERE status = 'en_attente'
                AND created_at < NOW() - INTERVAL ? HOUR`,
            [EXPIRE_AFTER_HOURS]
        )

        let cancelled = 0
        for (const order of orders) {
            const ok = await orderRepository.cancelPendingAndRestoreStock(order.id, "cron:expiredCheckout")
            if (ok) cancelled += 1
        }

        if (cancelled > 0) {
            Logger.info(`[cron:expiredCheckout] ${cancelled} commande(s) expiree(s) annulee(s)`)
        }
    }
    catch (error)
    {
        Logger.error("[cron:expiredCheckout] Erreur:", { msg: error.message })
    }
}

let intervalHandle = null

const start = () => {
    if (process.env.DISABLE_CRON === "1") {
        Logger.info("[cron:expiredCheckout] Desactive (DISABLE_CRON=1)")
        return
    }
    if (intervalHandle) return

    // Premier passage apres 2 min pour laisser le serveur demarrer
    setTimeout(() => {
        void runOnce()
        intervalHandle = setInterval(runOnce, TICK_MS)
    }, 2 * 60 * 1000)

    Logger.info(`[cron:expiredCheckout] Demarre (toutes les ${TICK_MS / 60000} min, seuil ${EXPIRE_AFTER_HOURS}h)`)
}

const stop = () => {
    if (intervalHandle) {
        clearInterval(intervalHandle)
        intervalHandle = null
    }
}

export const expiredCheckout = { start, stop, runOnce }
