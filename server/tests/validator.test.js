import { test } from "node:test"
import assert from "node:assert/strict"
import { Validator } from "../src/services/Validator.js"

test("isEmailValid accepte un email correct", () => {
    assert.equal(Validator.isEmailValid("user@glycibio.fr"), true)
    assert.equal(Validator.isEmailValid("a.b-c_d+e@sub.domain.co"), true)
})

test("isEmailValid rejette les emails invalides ou trop longs", () => {
    assert.equal(Validator.isEmailValid("pasunemail"), false)
    assert.equal(Validator.isEmailValid("a@b"), false)
    assert.equal(Validator.isEmailValid(123), false)
    assert.equal(Validator.isEmailValid(`${"a".repeat(260)}@x.fr`), false) // > 255 caracteres
})

test("isPasswordValid impose 12+ car. avec maj/min/chiffre/special", () => {
    assert.equal(Validator.isPasswordValid("Azertyui1234!"), true)
    assert.equal(Validator.isPasswordValid("court1!A"), false)        // < 12
    assert.equal(Validator.isPasswordValid("azertyuiop12!"), false)   // pas de majuscule
    assert.equal(Validator.isPasswordValid("AZERTYUIOP12!"), false)   // pas de minuscule
    assert.equal(Validator.isPasswordValid("Azertyuiopppp"), false)   // pas de chiffre/special
})

test("isPriceValid : strictement positif", () => {
    assert.equal(Validator.isPriceValid("3.50"), true)
    assert.equal(Validator.isPriceValid(0), false)
    assert.equal(Validator.isPriceValid(-5), false)
    assert.equal(Validator.isPriceValid("abc"), false)
})

test("isStockValid / isQuantityValid / isIdValid", () => {
    assert.equal(Validator.isStockValid(0), true)
    assert.equal(Validator.isStockValid(-1), false)
    assert.equal(Validator.isQuantityValid(1), true)
    assert.equal(Validator.isQuantityValid(0), false)
    assert.equal(Validator.isIdValid("12"), true)
    assert.equal(Validator.isIdValid(0), false)
    assert.equal(Validator.isIdValid(-3), false)
})

test("isGlycemicIndexValid : 0..110 ou vide", () => {
    assert.equal(Validator.isGlycemicIndexValid(""), true)
    assert.equal(Validator.isGlycemicIndexValid(55), true)
    assert.equal(Validator.isGlycemicIndexValid(111), false)
    assert.equal(Validator.isGlycemicIndexValid(-1), false)
})

test("isAddressValid : 10..500 caracteres", () => {
    assert.equal(Validator.isAddressValid("12 rue de la Paix, Paris"), true)
    assert.equal(Validator.isAddressValid("court"), false)
})

test("isJsonOrArray accepte tableau/objet/chaine JSON, rejette JSON invalide", () => {
    assert.equal(Validator.isJsonOrArray(["gluten"]), true)
    assert.equal(Validator.isJsonOrArray('["gluten"]'), true)
    assert.equal(Validator.isJsonOrArray("{pas du json"), false)
})

test("isHoneypotEmpty : vrai si le champ piege est vide", () => {
    assert.equal(Validator.isHoneypotEmpty(""), true)
    assert.equal(Validator.isHoneypotEmpty("   "), true)
    assert.equal(Validator.isHoneypotEmpty("bot a rempli"), false)
})
