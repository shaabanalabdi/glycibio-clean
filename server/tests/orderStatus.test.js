import { test } from "node:test"
import assert from "node:assert/strict"
import { VALID_STATUSES, isValidStatusTransition } from "../src/services/OrderStatus.js"

test("VALID_STATUSES : 7 statuts métier", () => {
    assert.equal(VALID_STATUSES.length, 7)
    assert.ok(VALID_STATUSES.includes("payee"))
    assert.ok(VALID_STATUSES.includes("remboursee"))
})

test("transitions valides acceptées", () => {
    assert.ok(isValidStatusTransition("en_attente", "payee"))
    assert.ok(isValidStatusTransition("en_attente", "annulee"))
    assert.ok(isValidStatusTransition("payee", "en_preparation"))
    assert.ok(isValidStatusTransition("en_preparation", "expediee"))
    assert.ok(isValidStatusTransition("expediee", "livree"))
    assert.ok(isValidStatusTransition("payee", "remboursee"))
})

test("transitions illogiques refusées (ex. en_attente -> livree sans paiement)", () => {
    assert.equal(isValidStatusTransition("en_attente", "livree"), false)
    assert.equal(isValidStatusTransition("en_attente", "expediee"), false)
    assert.equal(isValidStatusTransition("livree", "payee"), false)
    assert.equal(isValidStatusTransition("annulee", "payee"), false)
    assert.equal(isValidStatusTransition("remboursee", "en_attente"), false)
})

test("statut inchangé = no-op accepté", () => {
    assert.ok(isValidStatusTransition("livree", "livree"))
    assert.ok(isValidStatusTransition("en_attente", "en_attente"))
})
