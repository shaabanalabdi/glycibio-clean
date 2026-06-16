import crypto from "node:crypto";
import {Repository} from "../core/Repository.js";
import {db} from "../core/database.js";
import {User} from "../entity/User.js";
import {Logger} from "../services/Logger.js";

// Les jetons de reset / verification email sont des secrets a usage unique.
// On NE stocke JAMAIS le jeton brut : on persiste son empreinte SHA-256 (hex 64
// car -> compatible VARCHAR(64/255)). Le jeton brut n'existe que dans l'email
// envoye a l'utilisateur. Ainsi une fuite de la table `users` (dump, replica,
// injection ailleurs) ne donne PAS de jetons directement exploitables.
// SHA-256 nu suffit ici : le jeton est deja a haute entropie (crypto.randomBytes(32)),
// donc non bruteforcable -> pas besoin d'un KDF lent comme pour les mots de passe.
const hashToken = (token) => crypto.createHash("sha256").update(String(token)).digest("hex")

// Colonnes ajoutees par migrations successives : on les cree au demarrage si
// absentes (INFORMATION_SCHEMA pour compatibilite MySQL 5.7+ et 8.x).
const REQUIRED_USER_COLUMNS = [
    { name: "failed_attempts",      ddl: "INT NOT NULL DEFAULT 0" },
    { name: "locked_until",         ddl: "DATETIME NULL DEFAULT NULL" },
    { name: "newsletter_opt_in",    ddl: "TINYINT(1) NOT NULL DEFAULT 0" },
    { name: "newsletter_opt_in_at", ddl: "DATETIME NULL DEFAULT NULL" },
    { name: "tokens_valid_after",   ddl: "DATETIME NULL DEFAULT NULL" },
    // Verification email (verification "souple") : email_verified=0 par defaut
    // pour les nouveaux comptes ; les comptes existants sont "grandfathered" a 1
    // au moment de la creation de la colonne (voir ensureColumns).
    { name: "email_verified",             ddl: "TINYINT(1) NOT NULL DEFAULT 0" },
    { name: "verification_token",         ddl: "VARCHAR(64) NULL DEFAULT NULL" },
    { name: "verification_token_expires", ddl: "DATETIME NULL DEFAULT NULL" }
]

class UserRepository extends Repository {

    constructor() {
        super(User, "users");
    }

    ensureColumns = (() => {
        let promise = null
        return () => {
            if (!promise) {
                promise = (async () => {
                    try
                    {
                        const [rows] = await db.query(
                            `SELECT COLUMN_NAME
                               FROM INFORMATION_SCHEMA.COLUMNS
                              WHERE TABLE_SCHEMA = DATABASE()
                                AND TABLE_NAME = 'users'`
                        )
                        const present = new Set(rows.map((r) => r.COLUMN_NAME))
                        const missing = REQUIRED_USER_COLUMNS.filter((c) => !present.has(c.name))

                        for (const col of missing) {
                            try
                            {
                                await db.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.ddl}`)
                                Logger.info(`[UserRepository] Colonne ajoutee : users.${col.name}`)
                            }
                            catch (e)
                            {
                                Logger.warn(`[UserRepository] Echec ajout users.${col.name}: ${e.message}`)
                            }
                        }

                        // Grandfather : si email_verified vient d'etre cree, marquer
                        // TOUS les comptes existants comme verifies. Seuls les NOUVEAUX
                        // comptes (inseres ensuite avec le defaut 0) devront confirmer.
                        if (missing.some((c) => c.name === "email_verified")) {
                            try
                            {
                                await db.query("UPDATE users SET email_verified = 1")
                                Logger.info("[UserRepository] Comptes existants marques email_verified=1 (grandfather)")
                            }
                            catch (e)
                            {
                                Logger.warn(`[UserRepository] Grandfather email_verified echoue: ${e.message}`)
                            }
                        }
                    }
                    catch (e)
                    {
                        Logger.warn("[UserRepository] ensureColumns:", e.message)
                    }
                })()
            }
            return promise
        }
    })()

    isUsernameTaken = async (username) => {
        const [rows] = await db.query("SELECT id FROM users WHERE username = ? LIMIT 1", [username])
        return rows.length > 0
    }

    findAllForAdmin = async () => {
        const [rows] = await db.query(
            `SELECT id, email, role, first_name, last_name, is_active, created_at,
                    COALESCE(NULLIF(TRIM(CONCAT_WS(' ', first_name, last_name)), ''), email) AS display_name
               FROM users ORDER BY created_at DESC`
        )
        return rows
    }

    recordFailedAttempt = async (id, attempts, lockedUntil = null) => {
        if (lockedUntil) {
            await db.query("UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?", [attempts, lockedUntil, id])
        } else {
            await db.query("UPDATE users SET failed_attempts = ? WHERE id = ?", [attempts, id])
        }
    }

    resetLockout = async (id) => {
        await db.query("UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?", [id])
    }

    updatePassword = async (id, hashedPassword) => {
        await db.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, id])
    }

    setResetToken = async (id, token, expires) => {
        await db.query("UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?", [hashToken(token), expires, id])
    }

    findByValidResetToken = async (token) => {
        const [rows] = await db.query(
            "SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()",
            [hashToken(token)]
        )
        return rows.length === 0 ? null : rows[0]
    }

    // --- Verification email -------------------------------------------------
    setVerificationToken = async (id, token, expires) => {
        await db.query(
            "UPDATE users SET verification_token = ?, verification_token_expires = ? WHERE id = ?",
            [hashToken(token), expires, id]
        )
    }

    // Ne matche que les comptes NON verifies (empeche la reutilisation d'un
    // lien apres confirmation).
    findByValidVerificationToken = async (token) => {
        const [rows] = await db.query(
            "SELECT id FROM users WHERE verification_token = ? AND verification_token_expires > NOW() AND email_verified = 0",
            [hashToken(token)]
        )
        return rows.length === 0 ? null : rows[0]
    }

    markEmailVerified = async (id) => {
        await db.query(
            "UPDATE users SET email_verified = 1, verification_token = NULL, verification_token_expires = NULL WHERE id = ?",
            [id]
        )
    }

    // tokens_valid_after = NOW() : invalide tous les jetons emis avant la
    // reinitialisation (un attaquant ayant vole une session est ainsi ejecte).
    resetPasswordAndInvalidateTokens = async (id, hashedPassword) => {
        await db.query(
            "UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL, tokens_valid_after = NOW() WHERE id = ?",
            [hashedPassword, id]
        )
    }

    getTokensValidAfter = async (id) => {
        const [rows] = await db.query("SELECT tokens_valid_after FROM users WHERE id = ?", [id])
        return rows.length === 0 ? undefined : rows[0].tokens_valid_after
    }

    updateProfile = async (id, { first_name, last_name, address, phone }) => {
        await db.query(
            `UPDATE users SET
               first_name = COALESCE(?, first_name),
               last_name  = COALESCE(?, last_name),
               address    = ?,
               phone      = ?
             WHERE id = ?`,
            [first_name || null, last_name || null, address !== undefined ? address : null, phone !== undefined ? phone : null, id]
        )
        return this.find(id)
    }

    // tokens_valid_after = NOW() : le role est embarque dans le JWT. En changeant
    // de role (promotion OU retrogradation), on invalide les jetons deja emis pour
    // que le nouveau role prenne effet immediatement (sinon un admin retrograde
    // garderait ses droits jusqu'a expiration de son jeton, jusqu'a 24h).
    updateRole = async (id, role) => {
        await db.query("UPDATE users SET role = ?, tokens_valid_after = NOW() WHERE id = ?", [role, id])
    }

    deleteById = async (id) => {
        const [result] = await db.query("DELETE FROM users WHERE id = ?", [id])
        return result.affectedRows > 0
    }
}

export const userRepository = new UserRepository()
