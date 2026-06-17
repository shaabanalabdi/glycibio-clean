import {db} from "../core/database.js";

// ============================================================
// Parametres de site (cle/valeur). Ex: hero d'accueil (image + textes).
// Les cles sont WHITELISTEES (anti-injection d'identifiant / anti-abus).
// ============================================================

// Champs TEXTE editables du hero d'accueil (back-office "Apparence").
export const HERO_TEXT_KEYS = [
    "hero_eyebrow", "hero_title", "hero_title_highlight", "hero_text",
    "hero_cta_primary_label", "hero_cta_primary_link",
    "hero_cta_secondary_label", "hero_cta_secondary_link",
    "hero_trust_1", "hero_trust_2", "hero_trust_3"
]

const PUBLIC_KEYS = ["hero_background", ...HERO_TEXT_KEYS]
const ALLOWED = new Set(PUBLIC_KEYS)

// La table existe dans le dump SQL de prod ; ce CREATE IF NOT EXISTS couvre les
// bases existantes non re-importees. Memoise (s'execute une fois par process).
let ensured = null
const ensureTable = () => {
    if (!ensured) {
        ensured = db.query(`
            CREATE TABLE IF NOT EXISTS settings (
              setting_key   VARCHAR(64) PRIMARY KEY,
              setting_value TEXT NULL,
              updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB
        `).catch(() => {})
    }
    return ensured
}

class SettingRepository {
    get = async (key) => {
        if (!ALLOWED.has(key)) return null
        await ensureTable()
        const [rows] = await db.query("SELECT setting_value FROM settings WHERE setting_key = ?", [key])
        return rows.length === 0 ? null : rows[0].setting_value
    }

    // Objet { cle: valeur } limite aux cles publiques (defaut null si absente).
    getPublic = async () => {
        await ensureTable()
        const [rows] = await db.query(
            "SELECT setting_key, setting_value FROM settings WHERE setting_key IN (?)",
            [PUBLIC_KEYS]
        )
        const out = {}
        for (const key of PUBLIC_KEYS) out[key] = null
        for (const row of rows) out[row.setting_key] = row.setting_value
        return out
    }

    set = async (key, value) => {
        if (!ALLOWED.has(key)) throw new Error(`Cle de configuration non autorisee: ${key}`)
        await ensureTable()
        await db.query(
            `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
             ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
            [key, value]
        )
    }

    // Ecrit plusieurs cles en une fois (cles non whitelistees ignorees).
    setMany = async (entries) => {
        await ensureTable()
        for (const [key, value] of Object.entries(entries)) {
            if (!ALLOWED.has(key)) continue
            await db.query(
                `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
                [key, value]
            )
        }
    }
}

export const settingRepository = new SettingRepository()
