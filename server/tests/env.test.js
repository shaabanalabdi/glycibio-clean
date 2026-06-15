import { test } from "node:test"
import assert from "node:assert/strict"
import { validateEnv } from "../src/core/env.js"

const baseProd = () => ({
    NODE_ENV: "production",
    DB_HOST: "db", DB_USER: "app", DB_PASSWORD: "secret", DB_NAME: "glycibio",
    JWT_SECRET: "x".repeat(40),
    CORS_ORIGIN: "https://glycibio.fr"
})

test("config production valide -> ok", () => {
    const { ok, errors } = validateEnv(baseProd())
    assert.equal(ok, true)
    assert.equal(errors.length, 0)
})

test("JWT_SECRET manquant -> erreur fatale", () => {
    const env = baseProd()
    delete env.JWT_SECRET
    const { ok, errors } = validateEnv(env)
    assert.equal(ok, false)
    assert.ok(errors.some((e) => e.includes("JWT_SECRET")))
})

test("JWT_SECRET trop court (< 32) -> erreur fatale", () => {
    const { ok, errors } = validateEnv({ ...baseProd(), JWT_SECRET: "tropcourt" })
    assert.equal(ok, false)
    assert.ok(errors.some((e) => e.includes("trop court")))
})

test("variables BDD manquantes -> erreurs", () => {
    const env = baseProd()
    delete env.DB_PASSWORD
    delete env.DB_NAME
    const { ok, errors } = validateEnv(env)
    assert.equal(ok, false)
    assert.ok(errors.some((e) => e.includes("DB_PASSWORD")))
    assert.ok(errors.some((e) => e.includes("DB_NAME")))
})

test("production sans CORS_ORIGIN -> erreur", () => {
    const env = baseProd()
    delete env.CORS_ORIGIN
    assert.equal(validateEnv(env).ok, false)
})

test("Stripe actif sans STRIPE_WEBHOOK_SECRET en prod -> erreur", () => {
    const env = { ...baseProd(), STRIPE_SECRET_KEY: "sk_live_reel" }
    const { ok, errors } = validateEnv(env)
    assert.equal(ok, false)
    assert.ok(errors.some((e) => e.includes("STRIPE_WEBHOOK_SECRET")))
})

test("Stripe en placeholder -> n'exige pas le webhook secret", () => {
    const env = { ...baseProd(), STRIPE_SECRET_KEY: "sk_test_placeholder" }
    assert.equal(validateEnv(env).ok, true)
})

test("developpement -> ok avec un avertissement", () => {
    const { ok, warnings } = validateEnv({
        NODE_ENV: "development",
        DB_HOST: "localhost", DB_USER: "app", DB_PASSWORD: "p", DB_NAME: "glycibio",
        JWT_SECRET: "x".repeat(40)
    })
    assert.equal(ok, true)
    assert.ok(warnings.length >= 1)
})
