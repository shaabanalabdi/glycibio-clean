// ============================================================
// Index glycemique — SOURCE UNIQUE DE VERITE (seuils + libelles).
// Avant : la logique `ig <= 55 ? "bas" : ig <= 69 ? "moyen" : "eleve"` et les
// libelles etaient dupliques/divergents dans IgMeter, Cart, ProductFilter,
// Product et ProductCard (ex: "MODÉRÉ" vs "IG moyen" vs "Modéré"). Tout
// changement de seuil devait etre repercute a la main -> risque de derive.
// ============================================================
export const IG_BAS_MAX = 55     // <= 55 : IG bas
export const IG_MOYEN_MAX = 69    // 56..69 : IG modere ; >= 70 : IG eleve

export const igLevelOf = (ig) => {
    const n = Number(ig)
    if (!Number.isFinite(n)) return null
    if (n <= IG_BAS_MAX) return "bas"
    if (n <= IG_MOYEN_MAX) return "moyen"
    return "eleve"
}

export const IG_LEVEL_LABELS = { bas: "Bas", moyen: "Modéré", eleve: "Élevé" }
export const IG_LEVEL_RANGES = {
    bas: `0–${IG_BAS_MAX}`,
    moyen: `${IG_BAS_MAX + 1}–${IG_MOYEN_MAX}`,
    eleve: `${IG_MOYEN_MAX + 1}+`
}
