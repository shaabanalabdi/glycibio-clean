import "./style.scss"
import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { PackageSearch, AlertTriangle, SlidersHorizontal, ChevronDown } from "lucide-react"
import { ProductCard } from "@components/ProductCard/index.jsx"
import { ProductFilter } from "@components/ProductFilter/index.jsx"
import { Pagination } from "@components/Pagination/index.jsx"
import { Breadcrumb } from "@components/Breadcrumb/index.jsx"
import { EmptyState } from "@components/EmptyState/index.jsx"
import { ProductCardGridSkeleton } from "@components/Skeleton/index.jsx"
import { SORT_OPTIONS } from "@components/ProductFilter/index.jsx"
import { useDocumentMeta } from "@hooks/useDocumentMeta.js"
import { useDebouncedValue } from "@hooks/useDebouncedValue.js"
import { useGetProductsQuery } from "@slices/productApiSlice.js"
import { useGetCategoriesQuery } from "@slices/categoryApiSlice.js"

export const Catalog = () => {
    useDocumentMeta({
        title: "Catalogue - Aliments IG bas et modere | GlyciBio",
        description: "Decouvrez notre catalogue complet d'aliments a index glycemique controle : cereales, fruits, edulcorants naturels, snacks, complements.",
        canonical: "https://glycibio.fr/catalogue"
    })

    const [searchParams] = useSearchParams()
    const initialSearch = searchParams.get("search") || ""

    const [filters, setFilters] = useState({
        search: initialSearch,
        category: searchParams.get("category") || "",
        ig: searchParams.get("ig") || "",
        sort: searchParams.get("sort") || "",
        price_min: "",
        price_max: "",
        exclude_allergens: "",
        page: 1
    })

    // Sync filters with URL changes (e.g. navbar search bar)
    useEffect(() => {
        const next = searchParams.get("search") || ""
        // eslint-disable-next-line react-hooks/set-state-in-effect -- sync URL -> filtres
        setFilters((prev) => (prev.search === next ? prev : { ...prev, search: next, page: 1 }))
    }, [searchParams])

    // Charger les categories
    const { data: categories = [] } = useGetCategoriesQuery()

    // Recherche / prix : champs texte "debounced" pour NE PAS declencher une
    // requete API (et un scan SQL) a chaque frappe. RTK Query dedupe les args
    // identiques -> la rafale de frappes se reduit a une requete a la pause.
    // Les filtres discrets (categorie, IG, tri, allergenes) restent instantanes.
    const debouncedSearch = useDebouncedValue(filters.search, 350)
    const debouncedPriceMin = useDebouncedValue(filters.price_min, 400)
    const debouncedPriceMax = useDebouncedValue(filters.price_max, 400)

    // Construire les params avec les filtres (valeurs debouncees pour le texte)
    const params = { page: filters.page, limit: 8 }
    if (debouncedSearch) params.search = debouncedSearch
    if (filters.category) params.category = filters.category
    if (filters.ig) params.ig = filters.ig
    if (filters.sort) params.sort = filters.sort
    if (debouncedPriceMin) params.price_min = debouncedPriceMin
    if (debouncedPriceMax) params.price_max = debouncedPriceMax
    if (filters.exclude_allergens) params.exclude_allergens = filters.exclude_allergens

    const { data, isLoading: loading, isError: error, refetch } = useGetProductsQuery(params)
    const products = error ? [] : (data?.products ?? [])
    const pagination = data?.pagination ?? {}

    // Panneau de filtres repliable en mobile/tablette (bouton "Filtres")
    const [filtersOpen, setFiltersOpen] = useState(false)
    const activeFilterCount =
        (filters.search ? 1 : 0) +
        (filters.category ? 1 : 0) +
        (filters.ig ? 1 : 0) +
        (filters.price_min ? 1 : 0) +
        (filters.price_max ? 1 : 0) +
        (filters.exclude_allergens || "").split(",").filter(Boolean).length

    return (
        <div className="catalog">
            {/* Barre de titre — breadcrumb + titre + compteur + tri */}
            <div className="catalog__titlebar">
                <div className="catalog__titlebar-top">
                    <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Catalogue" }]} />
                </div>
                <div className="catalog__titlebar-main">
                    <h1 className="catalog__title">Tous les aliments</h1>
                    <div className="catalog__titlebar-tools">
                        {!error && (
                            <p className="catalog__count">
                                {pagination.total || 0} produit{pagination.total > 1 ? "s" : ""}
                            </p>
                        )}
                        <div className="catalog__sort">
                            <label htmlFor="catalog-sort" className="sr-only">Trier les produits</label>
                            <select
                                id="catalog-sort"
                                className="catalog__sort-select"
                                value={filters.sort}
                                onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value, page: 1 }))}
                            >
                                {SORT_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>Trier : {o.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="catalog__content">
                {/* Bouton repli des filtres — mobile/tablette uniquement */}
                <button
                    type="button"
                    className="catalog__filters-toggle"
                    aria-expanded={filtersOpen}
                    aria-controls="catalog-filters"
                    onClick={() => setFiltersOpen((open) => !open)}
                >
                    <SlidersHorizontal size={18} aria-hidden="true" />
                    <span>Filtres</span>
                    {activeFilterCount > 0 && (
                        <span className="catalog__filters-toggle-badge">{activeFilterCount}</span>
                    )}
                    <ChevronDown
                        size={18}
                        aria-hidden="true"
                        className={`catalog__filters-toggle-chevron ${filtersOpen ? "catalog__filters-toggle-chevron--open" : ""}`}
                    />
                </button>

                {/* Sidebar filtres */}
                <ProductFilter
                    filters={filters}
                    setFilters={setFilters}
                    categories={categories}
                    mobileOpen={filtersOpen}
                    onCloseMobile={() => setFiltersOpen(false)}
                />

                {/* Grille produits */}
                <div className="catalog__main">
                    {loading ? (
                        <ProductCardGridSkeleton count={8} />
                    ) : error ? (
                        <EmptyState
                            icon={AlertTriangle}
                            title="Impossible de charger les produits"
                            hint="Une erreur reseau est survenue. Verifiez votre connexion puis reessayez."
                            action={
                                <button
                                    type="button"
                                    className="btn btn--primary"
                                    onClick={() => refetch()}
                                >
                                    Reessayer
                                </button>
                            }
                        />
                    ) : products.length === 0 ? (
                        <EmptyState
                            icon={PackageSearch}
                            title="Aucun produit ne correspond"
                            hint="Essayez de retirer un filtre ou d'elargir la recherche."
                            action={
                                <button
                                    type="button"
                                    className="btn btn--outline"
                                    onClick={() =>
                                        setFilters({
                                            search: "",
                                            category: "",
                                            ig: "",
                                            sort: "",
                                            price_min: "",
                                            price_max: "",
                                            exclude_allergens: "",
                                            page: 1
                                        })
                                    }
                                >
                                    Reinitialiser les filtres
                                </button>
                            }
                        />
                    ) : (
                        <div className="catalog__grid">
                            {products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {!error && (
                        <Pagination
                            page={filters.page}
                            totalPages={pagination.totalPages || 1}
                            onPageChange={(p) => setFilters((prev) => ({ ...prev, page: p }))}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
