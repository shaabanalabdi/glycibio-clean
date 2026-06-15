// Calcul des montants d'une commande — fonction PURE (aucune E/S).
// -> Testable unitairement et reutilisable (panier serveur, devis, etc.).
// La BDD reste la source de verite finale (trigger sp_recalc_order_totals),
// mais ce calcul cote application doit etre coherent avec elle.
//
// Les prix sont arrondis a 2 decimales (centimes) pour eviter la derive
// flottante (ex: 0.1 + 0.2) sur les sommes d'euros.
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100

export const computeOrderTotals = (items, shippingCost = 0) => {
    const safeShipping = Number.isFinite(Number(shippingCost)) ? Number(shippingCost) : 0

    const subtotal = (items || []).reduce((sum, item) => {
        const price = parseFloat(item?.price)
        const qty = Number(item?.quantity)
        // Ignore les lignes invalides (prix non numerique, quantite <= 0).
        if (!Number.isFinite(price) || !Number.isInteger(qty) || qty <= 0) return sum
        return sum + price * qty
    }, 0)

    return {
        subtotal: round2(subtotal),
        shippingCost: round2(safeShipping),
        total: round2(subtotal + safeShipping)
    }
}
