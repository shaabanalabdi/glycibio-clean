// Mapping PUR d'un evenement Stripe -> action metier. Aucune E/S, aucune
// dependance -> testable unitairement sans Stripe ni BDD.
//
// Centralise la logique "quel evenement declenche quoi", isolee du controleur
// qui ne fait plus qu'executer l'action retournee.
//
// Actions possibles :
//   - "markPaid"            : passer la commande a "payee"
//   - "cancelRestoreStock"  : annuler la commande en attente + restaurer le stock
//   - "ignore"              : evenement non pertinent / donnees incompletes
export const resolveWebhookAction = (event) => {
    const none = { action: "ignore", orderId: null, paymentIntentId: null }
    if (!event || typeof event !== "object") return none

    const obj = (event.data && event.data.object) || {}
    const orderId = obj.metadata && obj.metadata.order_id ? obj.metadata.order_id : null

    switch (event.type) {
        case "checkout.session.completed":
            // Ne marquer "payee" QUE si Stripe confirme reellement le paiement.
            if (orderId && obj.payment_status === "paid") {
                return { action: "markPaid", orderId, paymentIntentId: obj.payment_intent || null }
            }
            return { ...none, orderId }

        case "checkout.session.expired":
        case "checkout.session.async_payment_failed":
        case "payment_intent.payment_failed":
        case "payment_intent.canceled":
            if (orderId) return { action: "cancelRestoreStock", orderId, paymentIntentId: null }
            return { ...none, orderId }

        default:
            return none
    }
}
