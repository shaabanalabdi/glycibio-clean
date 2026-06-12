// Logger structure leger (sans dependance).
// Format JSON par defaut en production, texte humain en dev.

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 }
const MIN_LEVEL = LEVELS[process.env.LOG_LEVEL?.toLowerCase()] || LEVELS.info
const JSON_OUTPUT = process.env.NODE_ENV === "production" || process.env.LOG_FORMAT === "json"

// Champs sensibles a redacter dans les logs
const REDACTED_KEYS = new Set([
    "password",
    "current_password",
    "new_password",
    "confirm_password",
    "token",
    "authorization",
    "reset_token",
    "stripe_payment_id"
])

const redact = (obj, depth = 0) => {
    if (obj === null || obj === undefined || depth > 4) return obj
    if (typeof obj !== "object") return obj
    if (Array.isArray(obj)) return obj.map((v) => redact(v, depth + 1))
    const out = {}
    for (const [k, v] of Object.entries(obj)) {
        if (REDACTED_KEYS.has(k.toLowerCase())) out[k] = "[REDACTED]"
        else out[k] = redact(v, depth + 1)
    }
    return out
}

const emit = (level, msg, context) => {
    if (LEVELS[level] < MIN_LEVEL) return
    const entry = {
        level,
        time: new Date().toISOString(),
        msg,
        ...(context ? { ctx: redact(context) } : {})
    }
    const out = JSON_OUTPUT
        ? JSON.stringify(entry)
        : `[${entry.time}] ${level.toUpperCase()} ${msg}${context ? " " + JSON.stringify(redact(context)) : ""}`

    if (level === "error") console.error(out)
    else if (level === "warn") console.warn(out)
    else console.log(out)
}

export class Logger {

    static debug(msg, ctx) {
        emit("debug", msg, ctx)
    }

    static info(msg, ctx) {
        emit("info", msg, ctx)
    }

    static warn(msg, ctx) {
        emit("warn", msg, ctx)
    }

    static error(msg, ctx) {
        emit("error", msg, ctx)
    }
}
