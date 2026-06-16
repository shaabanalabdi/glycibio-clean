// Test unitaire de EmailService.isConfigured : determine si un email PEUT etre
// envoye (SMTP_HOST/USER/PASS presents). Cette garde decide notamment si l'envoi
// idempotent de l'email de confirmation doit declencher une logique de retry
// (cf. services/OrderConfirmation.js) ou simplement no-op (dev sans SMTP).
import { test } from "node:test"
import assert from "node:assert/strict"
import { EmailService } from "../src/services/EmailService.js"

const SMTP_KEYS = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"]

const withEnv = (overrides, fn) => {
    const saved = Object.fromEntries(SMTP_KEYS.map((k) => [k, process.env[k]]))
    try {
        for (const k of SMTP_KEYS) delete process.env[k]
        for (const [k, v] of Object.entries(overrides)) process.env[k] = v
        return fn()
    } finally {
        for (const k of SMTP_KEYS) {
            if (saved[k] === undefined) delete process.env[k]
            else process.env[k] = saved[k]
        }
    }
}

test("isConfigured : vrai uniquement si SMTP_HOST, SMTP_USER et SMTP_PASS sont tous presents", () => {
    withEnv({ SMTP_HOST: "smtp.test", SMTP_USER: "u", SMTP_PASS: "p" }, () => {
        assert.equal(EmailService.isConfigured(), true)
    })
})

test("isConfigured : faux si une variable SMTP manque", () => {
    withEnv({ SMTP_HOST: "smtp.test", SMTP_USER: "u" }, () => {
        assert.equal(EmailService.isConfigured(), false, "SMTP_PASS manquant")
    })
    withEnv({ SMTP_USER: "u", SMTP_PASS: "p" }, () => {
        assert.equal(EmailService.isConfigured(), false, "SMTP_HOST manquant")
    })
    withEnv({}, () => {
        assert.equal(EmailService.isConfigured(), false, "aucune variable SMTP")
    })
})
