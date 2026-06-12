// Cron : detection des paniers abandonnes (toutes les heures).
// Envoie un email aux utilisateurs ayant un panier vieux de > 24h
// et n'ayant pas re-recu d'email depuis 7 jours.
// Desactivation : process.env.DISABLE_CRON=1
import {db} from "../core/database.js";
import {EmailService} from "../services/EmailService.js";
import {Logger} from "../services/Logger.js";

const ONE_HOUR_MS = 60 * 60 * 1000
const MIN_CART_AGE_HOURS = 24
const COOLDOWN_DAYS = 7

// Table de tracking anti-spam (bookkeeping du cron, pas une entite metier)
const ensureTrackingTable = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS abandoned_cart_sent (
          user_id    INT NOT NULL,
          sent_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (user_id),
          CONSTRAINT fk_acs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB
    `)
}

const findAbandonedCarts = async () => {
    const [rows] = await db.query(
        `
        SELECT u.id AS user_id, u.email,
               ci.id AS cart_item_id, ci.quantity,
               p.id AS product_id, p.name, p.price,
               (ci.quantity * p.price) AS subtotal,
               MAX(ci.created_at) OVER (PARTITION BY u.id) AS last_cart_activity
          FROM cart_items ci
          JOIN users u ON ci.user_id = u.id
          JOIN products p ON ci.product_id = p.id
         WHERE ci.created_at < NOW() - INTERVAL ? HOUR
           AND NOT EXISTS (
             SELECT 1 FROM abandoned_cart_sent acs
              WHERE acs.user_id = u.id
                AND acs.sent_at > NOW() - INTERVAL ? DAY
           )
        `,
        [MIN_CART_AGE_HOURS, COOLDOWN_DAYS]
    )

    // Grouper par user
    const byUser = new Map()
    for (const row of rows) {
        if (!byUser.has(row.user_id)) {
            byUser.set(row.user_id, { email: row.email, items: [] })
        }
        byUser.get(row.user_id).items.push({
            name: row.name,
            quantity: row.quantity,
            subtotal: row.subtotal
        })
    }
    return byUser
}

const markSent = async (userId) => {
    await db.query(
        `INSERT INTO abandoned_cart_sent (user_id, sent_at) VALUES (?, NOW())
         ON DUPLICATE KEY UPDATE sent_at = VALUES(sent_at)`,
        [userId]
    )
}

const runOnce = async () => {
    try
    {
        await ensureTrackingTable()
        const carts = await findAbandonedCarts()
        let sent = 0
        for (const [userId, { email, items }] of carts) {
            const ok = await EmailService.sendAbandonedCartEmail(email, items)
            if (ok) {
                await markSent(userId)
                sent += 1
            }
        }
        if (sent > 0) {
            Logger.info(`[cron:abandonedCart] ${sent} email(s) envoye(s)`)
        }
    }
    catch (error)
    {
        Logger.error("[cron:abandonedCart] Erreur:", { msg: error.message })
    }
}

let intervalHandle = null

const start = () => {
    if (process.env.DISABLE_CRON === "1") {
        Logger.info("[cron:abandonedCart] Desactive (DISABLE_CRON=1)")
        return
    }
    if (intervalHandle) return
    // Premier run apres 5 minutes (laisse le serveur demarrer), puis 1x/heure
    setTimeout(() => {
        void runOnce()
        intervalHandle = setInterval(runOnce, ONE_HOUR_MS)
    }, 5 * 60 * 1000)
    Logger.info("[cron:abandonedCart] Demarre (1x/heure)")
}

const stop = () => {
    if (intervalHandle) {
        clearInterval(intervalHandle)
        intervalHandle = null
    }
}

export const abandonedCart = { start, stop, runOnce }
