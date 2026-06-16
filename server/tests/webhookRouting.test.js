import { test } from "node:test"
import assert from "node:assert/strict"
import { resolveWebhookAction } from "../src/services/WebhookEvents.js"

test("checkout.session.completed PAYE -> markPaid (avec orderId + paymentIntent)", () => {
    const event = {
        type: "checkout.session.completed",
        data: { object: { payment_status: "paid", payment_intent: "pi_123", metadata: { order_id: "42" } } }
    }
    assert.deepEqual(resolveWebhookAction(event), {
        action: "markPaid", orderId: "42", paymentIntentId: "pi_123"
    })
})

test("checkout.session.completed NON paye -> ignore (pas de marquage)", () => {
    const event = {
        type: "checkout.session.completed",
        data: { object: { payment_status: "unpaid", metadata: { order_id: "42" } } }
    }
    assert.equal(resolveWebhookAction(event).action, "ignore")
})

test("checkout.session.expired -> cancelRestoreStock", () => {
    const event = { type: "checkout.session.expired", data: { object: { metadata: { order_id: "7" } } } }
    const r = resolveWebhookAction(event)
    assert.equal(r.action, "cancelRestoreStock")
    assert.equal(r.orderId, "7")
})

test("payment_intent.payment_failed / canceled -> cancelRestoreStock", () => {
    for (const type of ["payment_intent.payment_failed", "payment_intent.canceled", "checkout.session.async_payment_failed"]) {
        const event = { type, data: { object: { metadata: { order_id: "9" } } } }
        assert.equal(resolveWebhookAction(event).action, "cancelRestoreStock", `pour ${type}`)
    }
})

test("charge.refunded TOTAL -> refund (resolu via payment_intent)", () => {
    const event = {
        type: "charge.refunded",
        data: { object: { refunded: true, payment_intent: "pi_777", metadata: {} } }
    }
    assert.deepEqual(resolveWebhookAction(event), {
        action: "refund", orderId: null, paymentIntentId: "pi_777"
    })
})

test("charge.refunded PARTIEL -> ignore (non traite automatiquement)", () => {
    const event = {
        type: "charge.refunded",
        data: { object: { refunded: false, amount: 5000, amount_refunded: 1000, payment_intent: "pi_888" } }
    }
    assert.equal(resolveWebhookAction(event).action, "ignore")
})

test("evenement sans order_id -> ignore", () => {
    const event = { type: "checkout.session.expired", data: { object: { metadata: {} } } }
    assert.equal(resolveWebhookAction(event).action, "ignore")
})

test("type inconnu / event null -> ignore (robustesse)", () => {
    assert.equal(resolveWebhookAction({ type: "invoice.paid", data: { object: {} } }).action, "ignore")
    assert.equal(resolveWebhookAction(null).action, "ignore")
    assert.equal(resolveWebhookAction(undefined).action, "ignore")
})
