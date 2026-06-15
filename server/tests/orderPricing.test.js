import { test } from "node:test"
import assert from "node:assert/strict"
import { computeOrderTotals } from "../src/services/OrderPricing.js"

test("calcule le sous-total a partir des lignes du panier", () => {
    const items = [
        { price: "3.50", quantity: 2 }, // 7.00
        { price: "4.20", quantity: 1 }  // 4.20
    ]
    const { subtotal, total } = computeOrderTotals(items, 0)
    assert.equal(subtotal, 11.2)
    assert.equal(total, 11.2)
})

test("ajoute le cout de livraison au total", () => {
    const items = [{ price: "10.00", quantity: 1 }]
    const { subtotal, shippingCost, total } = computeOrderTotals(items, 4.9)
    assert.equal(subtotal, 10)
    assert.equal(shippingCost, 4.9)
    assert.equal(total, 14.9)
})

test("arrondit au centime (pas de derive flottante)", () => {
    const items = [
        { price: "0.10", quantity: 1 },
        { price: "0.20", quantity: 1 }
    ]
    const { subtotal } = computeOrderTotals(items, 0)
    assert.equal(subtotal, 0.3) // et non 0.30000000000000004
})

test("ignore les lignes invalides (prix NaN, quantite <= 0)", () => {
    const items = [
        { price: "abc", quantity: 3 },
        { price: "5.00", quantity: 0 },
        { price: "5.00", quantity: 2 } // seule ligne valide -> 10
    ]
    assert.equal(computeOrderTotals(items, 0).total, 10)
})

test("panier vide / arguments absents -> 0", () => {
    assert.deepEqual(computeOrderTotals([], 0), { subtotal: 0, shippingCost: 0, total: 0 })
    assert.deepEqual(computeOrderTotals(undefined, undefined), { subtotal: 0, shippingCost: 0, total: 0 })
})
