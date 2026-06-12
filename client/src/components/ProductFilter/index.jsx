import { useMemo } from "react"
import { X } from "lucide-react"

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

            {/* Sort — always visible, not collapsible -------------------- */}
            <div className="filters__group filters__group--primary">
                <label htmlFor="filter-sort">Trier par</label>
                <select
                    id="filter-sort"
                    value={filters.sort}
                    onChange={(e) => handleChange("sort", e.target.value)}
                >
                    {SORT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
            </div>

            {/* Search ---------------------------------------------------- */}
            <details className="filters__section" open>
                <summary>Recherche</summary>
                <div className="filters__section-body">
                    <input
                        type="search"
                        placeholder="Nom du produit..."
                        value={filters.search}
                        onChange={(e) => handleChange("search", e.target.value)}
                        aria-label="Rechercher dans le catalogue"
                    />
                </div>
            </details>

            {/* Category -------------------------------------------------- */}
            <details className="filters__section" open>
                <summary>Cat&eacute;gorie</summary>
                <div className="filters__section-body">
                    <select
                        value={filters.category}
                        onChange={(e) => handleChange("category", e.target.value)}
                        aria-label="Categorie"
                    >
                        <option value="">Toutes les cat&eacute;gories</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
            </details>

            {/* IG -------------------------------------------------------- */}
            <details className="filters__section" open>
                <summary>Index Glyc&eacute;mique</summary>
                <div className="filters__section-body">
                    <select
                        value={filters.ig}
                        onChange={(e) => handleChange("ig", e.target.value)}
                        aria-label="Index glycemique"
                    >
                        <option value="">Tous</option>
                        <option value="bas">Bas (&le; 55)</option>
                        <option value="moyen">Moyen (56-69)</option>
                        <option value="eleve">&Eacute;lev&eacute; (&ge; 70)</option>
                    </select>
                </div>
            </details>

            {/* Price ----------------------------------------------------- */}
            <details className="filters__section" open>
                <summary>Prix (&euro;)</summary>
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
            </details>

            {/* Allergens ------------------------------------------------- */}
            <details className="filters__section" open>
                <summary>Allerg&egrave;nes &agrave; exclure</summary>
                <div className="filters__section-body">
                    <div className="filters__checks" role="group" aria-label="Allergenes a exclure">
                        {COMMON_ALLERGENS.map((a) => (
                            <label key={a} className="filters__check">
                                <input
                                    type="checkbox"
                                    checked={isExcluded(a)}
                                    onChange={() => toggleExclude(a)}
                                />
                                <span>{ALLERGEN_LABELS[a]}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </details>
        </aside>
    )
}
