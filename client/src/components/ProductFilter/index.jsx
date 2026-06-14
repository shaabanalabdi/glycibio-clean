import { useMemo, useRef, useState, useEffect, useCallback } from "react"
import { X, Check } from "lucide-react"

const COMMON_ALLERGENS = [
    "gluten",
    "lactose",
    "fruits_a_coque",
    "soja",
    "sesame"
]

const ALLERGEN_LABELS = {
    gluten: "Gluten",
    lactose: "Lactose",
    fruits_a_coque: "Fruits a coque",
    soja: "Soja",
    sesame: "Sesame"
}

const IG_LABELS = {
    bas: "IG bas",
    moyen: "IG moyen",
    eleve: "IG eleve"
}

const SORT_OPTIONS = [
    { value: "", label: "Plus recents" },
    { value: "price_asc", label: "Prix croissant" },
    { value: "price_desc", label: "Prix decroissant" },
    { value: "name_asc", label: "Nom A-Z" },
    { value: "ig_asc", label: "IG croissant" }
]

// Chips IG (le mecanisme fonctionnel reste filters.ig = ''|'bas'|'moyen'|'eleve').
const IG_CHIPS = [
    { value: "bas", label: "Bas" },
    { value: "moyen", label: "Modéré" },
    { value: "eleve", label: "Élevé" }
]

// Bandes IG -> bornes visuelles du slider signature (0-100).
// Le slider est un indicateur VISUEL synchronise avec les chips :
// il ne cree aucun nouveau parametre d'API (pas de ig_min/ig_max).
const IG_BANDS = {
    bas:   { min: 0,  max: 55,  caption: "0 – 55 sélectionné" },
    moyen: { min: 56, max: 69,  caption: "56 – 69 sélectionné" },
    eleve: { min: 70, max: 100, caption: "70 – 100 sélectionné" }
}
const IG_FULL = { min: 0, max: 100, caption: "0 – 100 (tous)" }

const DEFAULT_FILTERS = {
    search: "",
    category: "",
    ig: "",
    sort: "",
    price_min: "",
    price_max: "",
    exclude_allergens: "",
    page: 1
}

// Mappe une position 0-100 vers la bande IG correspondante.
const posToBand = (pos) => (pos <= 55 ? "bas" : pos <= 69 ? "moyen" : "eleve")

export const ProductFilter = ({ filters, setFilters, categories }) => {
    const handleChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value, page: 1 }))
    }

    const toggleExclude = (allergen) => {
        setFilters((prev) => {
            const current = new Set((prev.exclude_allergens || "").split(",").filter(Boolean))
            if (current.has(allergen)) current.delete(allergen)
            else current.add(allergen)
            return { ...prev, exclude_allergens: Array.from(current).join(","), page: 1 }
        })
    }

    const isExcluded = (allergen) =>
        (filters.exclude_allergens || "").split(",").includes(allergen)

    const resetFilters = () => setFilters({ ...DEFAULT_FILTERS })

    // Toggle d'une bande IG (chip OU drag du slider) — meme mecanisme.
    const toggleIg = (band) => {
        handleChange("ig", filters.ig === band ? "" : band)
    }
    const setIgBand = (band) => {
        if (filters.ig !== band) handleChange("ig", band)
    }

    // ---- Slider signature : deux poignees synchronisees avec filters.ig ----
    const trackRef = useRef(null)
    const [dragging, setDragging] = useState(null) // 'min' | 'max' | null

    const band = filters.ig ? IG_BANDS[filters.ig] : IG_FULL
    const { min: lowPos, max: highPos, caption } = band

    const posFromEvent = useCallback((clientX) => {
        const el = trackRef.current
        if (!el) return 0
        const rect = el.getBoundingClientRect()
        const ratio = (clientX - rect.left) / rect.width
        return Math.round(Math.min(100, Math.max(0, ratio * 100)))
    }, [])

    useEffect(() => {
        if (!dragging) return undefined
        const onMove = (e) => {
            const clientX = e.touches ? e.touches[0].clientX : e.clientX
            const nextBand = posToBand(posFromEvent(clientX))
            // Functional update — never reads stale filters.ig, no-op if unchanged.
            setFilters((prev) => (prev.ig === nextBand ? prev : { ...prev, ig: nextBand, page: 1 }))
        }
        const onUp = () => setDragging(null)
        window.addEventListener("pointermove", onMove)
        window.addEventListener("pointerup", onUp)
        window.addEventListener("touchmove", onMove, { passive: true })
        window.addEventListener("touchend", onUp)
        return () => {
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("pointerup", onUp)
            window.removeEventListener("touchmove", onMove)
            window.removeEventListener("touchend", onUp)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dragging, posFromEvent])

    // Clavier : fleches sur une poignee deplacent la bande.
    const onHandleKey = (which) => (e) => {
        const order = ["bas", "moyen", "eleve"]
        const current = filters.ig || (which === "min" ? "bas" : "eleve")
        const idx = order.indexOf(current)
        if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            e.preventDefault()
            setIgBand(order[Math.min(order.length - 1, idx + 1)])
        } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            e.preventDefault()
            setIgBand(order[Math.max(0, idx - 1)])
        }
    }

    // Active filter chips (visible at top — removable)
    const activeChips = useMemo(() => {
        const chips = []
        if (filters.search) {
            chips.push({
                key: "search",
                label: `"${filters.search}"`,
                onRemove: () => handleChange("search", "")
            })
        }
        if (filters.category) {
            const cat = categories.find((c) => String(c.id) === String(filters.category))
            if (cat) chips.push({
                key: "category",
                label: cat.name,
                onRemove: () => handleChange("category", "")
            })
        }
        if (filters.ig) {
            chips.push({
                key: "ig",
                label: IG_LABELS[filters.ig] || filters.ig,
                onRemove: () => handleChange("ig", "")
            })
        }
        if (filters.price_min) {
            chips.push({
                key: "pmin",
                label: `≥ ${filters.price_min} €`,
                onRemove: () => handleChange("price_min", "")
            })
        }
        if (filters.price_max) {
            chips.push({
                key: "pmax",
                label: `≤ ${filters.price_max} €`,
                onRemove: () => handleChange("price_max", "")
            })
        }
        (filters.exclude_allergens || "")
            .split(",")
            .filter(Boolean)
            .forEach((a) => {
                chips.push({
                    key: `a-${a}`,
                    label: `Sans ${ALLERGEN_LABELS[a] || a}`,
                    onRemove: () => toggleExclude(a)
                })
            })
        return chips
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, categories])

    const activeCount = activeChips.length

    return (
        <aside className="filters" aria-label="Filtres de recherche">
            {/* Header ----------------------------------------------------- */}
            <div className="filters__header">
                <h3 className="filters__title">
                    Filtres
                    {activeCount > 0 && (
                        <span className="filters__badge" aria-label={`${activeCount} filtres actifs`}>
                            {activeCount}
                        </span>
                    )}
                </h3>
                {activeCount > 0 && (
                    <button onClick={resetFilters} className="filters__reset" type="button">
                        Tout effacer
                    </button>
                )}
            </div>

            {/* Active filter chips --------------------------------------- */}
            {activeCount > 0 && (
                <div className="filters__chips" role="list" aria-label="Filtres actifs">
                    {activeChips.map((chip) => (
                        <button
                            key={chip.key}
                            type="button"
                            className="filters__chip"
                            onClick={chip.onRemove}
                            aria-label={`Retirer le filtre ${chip.label}`}
                            role="listitem"
                        >
                            <span>{chip.label}</span>
                            <X size={14} strokeWidth={2.5} aria-hidden="true" />
                        </button>
                    ))}
                </div>
            )}

            {/* Search ---------------------------------------------------- */}
            <section className="filters__section">
                <h4 className="filters__section-title filters__section-title--green">Recherche</h4>
                <div className="filters__section-body">
                    <input
                        type="search"
                        placeholder="Nom du produit..."
                        value={filters.search}
                        onChange={(e) => handleChange("search", e.target.value)}
                        aria-label="Rechercher dans le catalogue"
                    />
                </div>
            </section>

            {/* IG — slider signature + chips ----------------------------- */}
            <section className="filters__section">
                <h4 className="filters__section-title filters__section-title--green">Index glyc&eacute;mique</h4>
                <div className="filters__section-body">
                    {/* Piste gradient IG + deux poignees draggables (indicateur visuel) */}
                    <div className="ig-slider">
                        <div className="ig-slider__track" ref={trackRef}>
                            <span
                                className="ig-slider__range"
                                style={{ left: `${lowPos}%`, width: `${highPos - lowPos}%` }}
                            />
                            <button
                                type="button"
                                className="ig-slider__handle"
                                style={{ left: `${lowPos}%` }}
                                onPointerDown={() => setDragging("min")}
                                onKeyDown={onHandleKey("min")}
                                role="slider"
                                aria-label="Borne IG basse"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={lowPos}
                            />
                            <button
                                type="button"
                                className="ig-slider__handle"
                                style={{ left: `${highPos}%` }}
                                onPointerDown={() => setDragging("max")}
                                onKeyDown={onHandleKey("max")}
                                role="slider"
                                aria-label="Borne IG haute"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={highPos}
                            />
                        </div>
                        <div className="ig-slider__scale" aria-hidden="true">
                            <span>IG<br />0</span>
                            <span className="ig-slider__caption">{caption}</span>
                        </div>
                    </div>

                    {/* Chips Bas / Moderé / Élevé — controle fonctionnel */}
                    <div className="ig-chips" role="group" aria-label="Niveau d'index glycemique">
                        {IG_CHIPS.map((chip) => (
                            <button
                                key={chip.value}
                                type="button"
                                className={`ig-chips__chip ig-chips__chip--${chip.value} ${filters.ig === chip.value ? "ig-chips__chip--active" : ""}`}
                                aria-pressed={filters.ig === chip.value}
                                onClick={() => toggleIg(chip.value)}
                            >
                                {chip.label}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Category -------------------------------------------------- */}
            <section className="filters__section">
                <h4 className="filters__section-title filters__section-title--blue">Cat&eacute;gories</h4>
                <div className="filters__section-body">
                    <div className="filters__checks" role="group" aria-label="Categories">
                        <label className="filters__check filters__check--cat">
                            <input
                                type="radio"
                                name="filter-category"
                                checked={filters.category === ""}
                                onChange={() => handleChange("category", "")}
                            />
                            <span className="filters__check-box" aria-hidden="true">
                                <Check size={13} strokeWidth={3} />
                            </span>
                            <span className="filters__check-label">Toutes les cat&eacute;gories</span>
                        </label>
                        {categories.map((cat) => {
                            const count = cat.active_products_count ?? cat.products_count ?? cat.count
                            return (
                                <label key={cat.id} className="filters__check filters__check--cat">
                                    <input
                                        type="radio"
                                        name="filter-category"
                                        checked={String(filters.category) === String(cat.id)}
                                        onChange={() => handleChange("category", cat.id)}
                                    />
                                    <span className="filters__check-box" aria-hidden="true">
                                        <Check size={13} strokeWidth={3} />
                                    </span>
                                    <span className="filters__check-label">{cat.name}</span>
                                    {count != null && (
                                        <span className="filters__check-count">{count}</span>
                                    )}
                                </label>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Price ----------------------------------------------------- */}
            <section className="filters__section">
                <h4 className="filters__section-title filters__section-title--blue">Prix (&euro;)</h4>
                <div className="filters__section-body">
                    <div className="filters__range">
                        <input
                            type="number"
                            min="0"
                            step="0.5"
                            placeholder="Min"
                            value={filters.price_min || ""}
                            onChange={(e) => handleChange("price_min", e.target.value)}
                            aria-label="Prix minimum"
                        />
                        <span aria-hidden="true">&ndash;</span>
                        <input
                            type="number"
                            min="0"
                            step="0.5"
                            placeholder="Max"
                            value={filters.price_max || ""}
                            onChange={(e) => handleChange("price_max", e.target.value)}
                            aria-label="Prix maximum"
                        />
                    </div>
                </div>
            </section>

            {/* Regime / Allergens — pill toggles ------------------------- */}
            <section className="filters__section">
                <h4 className="filters__section-title filters__section-title--green">R&eacute;gime &middot; allerg&egrave;nes &agrave; exclure</h4>
                <div className="filters__section-body">
                    <div className="regime-pills" role="group" aria-label="Allergenes a exclure">
                        {COMMON_ALLERGENS.map((a) => (
                            <button
                                key={a}
                                type="button"
                                className={`regime-pills__pill ${isExcluded(a) ? "regime-pills__pill--active" : ""}`}
                                aria-pressed={isExcluded(a)}
                                onClick={() => toggleExclude(a)}
                            >
                                Sans {ALLERGEN_LABELS[a]}
                            </button>
                        ))}
                    </div>
                </div>
            </section>
        </aside>
    )
}

// Export des options de tri pour la barre de titre du catalogue (meme mecanisme filters.sort).
export { SORT_OPTIONS }
