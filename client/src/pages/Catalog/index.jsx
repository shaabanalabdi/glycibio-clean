import "./style.scss"
import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { PackageSearch, AlertTriangle } from "lucide-react"
import { ProductCard } from "@components/ProductCard/index.jsx"
import { ProductFilter } from "@components/ProductFilter/index.jsx"
import { Pagination } from "@components/Pagination/index.jsx"
import { Breadcrumb } from "@components/Breadcrumb/index.jsx"
import { EmptyState } from "@components/EmptyState/index.jsx"
import { ProductCardGridSkeleton } from "@components/Skeleton/index.jsx"
import { useDocumentMeta } from "@hooks/useDocumentMeta.js"
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

    // Charger les produits (a chaque changement de filtre)
    // Construire les params avec les filtres
    const params = { page: filters.page, limit: 8 }
    if (filters.search) params.search = filters.search
    if (filters.category) params.category = filters.category
    if (filters.ig) params.ig = filters.ig
    if (filters.sort) params.sort = filters.sort
    if (filters.price_min) params.price_min = filters.price_min
    if (filters.price_max) params.price_max = filters.price_max
    if (filters.exclude_allergens) params.exclude_allergens = filters.exclude_allergens

    const { data, isLoading: loading, isError: error, refetch } = useGetProductsQuery(params)
    const products = error ? [] : (data?.products ?? [])
    const pagination = data?.pagination ?? {}

    return (
        <div className="catalog">
            <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Catalogue" }]} />
            <h1 className="catalog__title">Nos Produits</h1>

            <div className="catalog__content">
                {/* Sidebar filtres */}
                <ProductFilter
                    filters={filters}
                    setFilters={setFilters}
                    categories={categories}
                />

                {/* Grille produits */}
                <div className="catalog__main">
                    {/* Compteur resultats */}
                    {!error && (
                        <p className="catalog__count">
                            {pagination.total || 0} produit{pagination.total > 1 ? "s" : ""} trouve{pagination.total > 1 ? "s" : ""}
                        </p>
                    )}

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
