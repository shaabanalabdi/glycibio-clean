import { test } from "node:test"
import assert from "node:assert/strict"
import { formatPrice } from "./formatPrice.js"

test("formatPrice : euros avec virgule décimale", () => {
    const out = formatPrice(4.5)
    assert.ok(out.includes("4,50"), out)
    assert.ok(out.includes("€"), out)
})

test("formatPrice : accepte une chaîne numérique", () => {
    assert.ok(formatPrice("3.2").includes("3,20"))
})

test("formatPrice : valeur invalide -> 0,00", () => {
    assert.ok(formatPrice("abc").includes("0,00"))
    assert.ok(formatPrice(undefined).includes("0,00"))
    assert.ok(formatPrice(null).includes("0,00"))
})
