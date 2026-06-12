import "./style.scss"
import { useState, useEffect, useRef } from "react"
import { useParams, Link } from "react-router-dom"
import { ShoppingCart, ArrowLeft, Minus, Plus } from "lucide-react"
import { ProductCard } from "@components/ProductCard/index.jsx"
import { ProductGallery } from "@components/ProductGallery/index.jsx"
import { ProductReviews } from "@components/ProductReviews/index.jsx"
import { Breadcrumb } from "@components/Breadcrumb/index.jsx"
import { ScrollReveal } from "@components/ScrollReveal/index.jsx"
import { useCart } from "@hooks/useCart.js"
import { useDocumentMeta } from "@hooks/useDocumentMeta.js"
import { useGetProductQuery, useGetRelatedProductsQuery } from "@slices/productApiSlice.js"
import { formatPrice } from "@utils/formatPrice.js"

const SITE_BASE = "https://glycibio.fr"

export const Product = () => {
    const { id } = useParams()
    const { addToCart: addCart } = useCart()
    const [quantity, setQuantity] = useState(1)
    const [added, setAdded] = useState(false)
    const [error, setError] = useState("")
    // La barre sticky mobile ne s'affiche QUE quand le CTA inline est sorti
    // de l'ecran (IntersectionObserver). Evite l'affichage en double.
    const inlineCtaRef = useRef(null)
    const [inlineCtaVisible, setInlineCtaVisible] = useState(true)

    const {
        data: product,
        isLoading: loading,
        isError,
        error: queryError,
        refetch
    } = useGetProductQuery(id)
    const { data: related = [] } = useGetRelatedProductsQuery(id)

    // 'notfound' | 'error' | null
    const loadError = isError ? (queryError?.status === 404 ? "notfound" : "error") : null

    useEffect(() => {
        const node = inlineCtaRef.current
        if (!node || typeof IntersectionObserver === "undefined") return
        const observer = new IntersectionObserver(
            ([entry]) => setInlineCtaVisible(entry.isIntersecting),
            { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
        )
        observer.observe(node)
        return () => observer.disconnect()
    }, [product])

    const addToCart = async () => {
        setError("")
        const { ok, message } = await addCart(product, quantity)
        if (ok) {
            setAdded(true)
            setTimeout(() => setAdded(false), 3000)
        } else {
            setError(message || "Erreur d'ajout au panier")
        }
    }

    // ----- Derived data (null-safe so hooks below can run before early returns)
    const buildAbs = (u) => (u ? `${SITE_BASE}${u.startsWith("/") ? "" : "/"}${u}` : undefined)

    let allergens = []
    let nutrition = {}
    if (product) {
        try
        {
            allergens = typeof product.allergens === "string" ? JSON.parse(product.allergens) : product.allergens || []
            nutrition = typeof product.nutritional_info === "string" ? JSON.parse(product.nutritional_info) : product.nutritional_info || {}
        }
        catch
        {
            // ignore parsing errors
        }
    }

    const igClass = product?.ig_category || "bas"
    const canonical = product ? `${SITE_BASE}/produit/${product.slug || product.id}` : undefined
    const imageUrl = product ? buildAbs(product.image) : undefined
    const allImages = product
        ? [
            ...(product.image ? [buildAbs(product.image)] : []),
            ...((product.gallery || []).map((g) => buildAbs(g.url)).filter(Boolean))
        ]
        : []

    // Hook must run on EVERY render (Rules of Hooks). When product is null
    // we pass an empty meta object — the hook becomes a no-op.
    useDocumentMeta(
        product
            ? {
                title: `${product.name} - IG ${product.glycemic_index} | GlyciBio`,
                description: (product.description || "").slice(0, 160),
                canonical,
                ogImage: imageUrl,
                ogType: "product",
                jsonLd: {
                    "@context": "https://schema.org",
                    "@type": "Product",
                    name: product.name,
                    image: allImages.length > 1 ? allImages : imageUrl,
                    description: product.description,
                    sku: String(product.id),
                    brand: { "@type": "Brand", name: "GlyciBio" },
                    offers: {
                        "@type": "Offer",
                        url: canonical,
                        priceCurrency: "EUR",
                        price: Number(product.price).toFixed(2),
                        availability: product.stock > 0
                            ? "https://schema.org/InStock"
                            : "https://schema.org/OutOfStock",
                        itemCondition: "https://schema.org/NewCondition"
                    }
                }
            }
            : {}
    )

    // Early returns now safe — all hooks have been called above
    if (loading) return <p className="product-loading">Chargement...</p>
    if (!product) {
        return (
            <div className="product-page">
                <Link to="/catalogue" className="product-page__back">
                    <ArrowLeft size={18} /> Retour au catalogue
                </Link>
                {loadError === "error" ? (
                    <div className="product-page__load-error" role="alert">
                        <p>Impossible de charger ce produit pour le moment (probleme de connexion).</p>
                        <button
                            type="button"
                            className="btn btn--primary"
                            onClick={() => refetch()}
                        >
                            Reessayer
                        </button>
                    </div>
                ) : (
                    <p className="product-loading">Produit non trouve</p>
                )}
            </div>
        )
    }

    return (
        <div className="product-page">
            <Breadcrumb
                items={[
                    { label: "Accueil", href: "/" },
                    { label: "Catalogue", href: "/catalogue" },
                    ...(product.category_name ? [{ label: product.category_name, href: `/catalogue?category=${product.category_id || ""}` }] : []),
                    { label: product.name }
                ]}
            />
            <Link to="/catalogue" className="product-page__back">
                <ArrowLeft size={18} /> Retour au catalogue
            </Link>

            <div className="product-page__content">
                {/* Galerie (image principale + images supplementaires) */}
                <div className="product-page__image">
                    <ProductGallery
                        productName={product.name}
                        images={[
                            ...(product.image ? [{ url: product.image, alt: product.name }] : []),
                            ...((product.gallery || []).map((g) => ({ url: g.url, alt: g.alt })))
                        ]}
                    />
                </div>

                {/* Infos */}
                <div className="product-page__info">
                    <p className="product-page__category">{product.category_name}</p>
                    <h1 className="product-page__name">{product.name}</h1>

                    <div className="product-page__ig">
                        <span className={`badge-ig badge-ig--${igClass} badge-ig--lg`}>
                            IG {product.glycemic_index}
                        </span>
                        <span className="product-page__ig-label">
                            Index glycemique {igClass === "bas" ? "bas" : igClass === "moyen" ? "moyen" : "eleve"}
                        </span>
                    </div>

                    <p className="product-page__price">{formatPrice(product.price)}</p>

                    <p className="product-page__stock">
                        {product.stock > 0 ? (
                            <span className="product-page__stock--available">En stock ({product.stock} disponibles)</span>
                        ) : (
                            <span className="product-page__stock--out">Rupture de stock</span>
                        )}
                    </p>

                    <p className="product-page__description">{product.description}</p>

                    {/* Allergenes */}
                    {allergens.length > 0 && (
                        <div className="product-page__allergens">
                            <h3>Allergenes</h3>
                            <div className="product-page__allergens-list">
                                {allergens.map((a, i) => (
                                    <span key={i} className="allergen-badge">{a}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Ajouter au panier */}
                    {product.stock > 0 && (
                        <div className="product-page__cart" ref={inlineCtaRef}>
                            {error && <p className="product-page__error">{error}</p>}

                            <div className="product-page__quantity">
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                                    <Minus size={18} />
                                </button>
                                <span>{quantity}</span>
                                <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>
                                    <Plus size={18} />
                                </button>
                            </div>

                            <button
                                className={`btn btn--primary btn--lg ${added ? "btn--success" : ""}`}
                                onClick={addToCart}
                            >
                                {added ? (
                                    "Ajoute au panier"
                                ) : (
                                    <><ShoppingCart size={20} /> Ajouter au panier</>
                                )}
                            </button>
                        </div>
                    )}

                </div>
            </div>

            {/* Tableau nutritionnel */}
            {Object.keys(nutrition).length > 0 && (
                <section className="product-page__nutrition">
                    <h2>Informations nutritionnelles</h2>
                    <table className="nutrition-table">
                        <thead>
                            <tr>
                                <th>Nutriment</th>
                                <th>Valeur</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(nutrition).map(([key, value]) => (
                                <tr key={key}>
                                    <td>{key.charAt(0).toUpperCase() + key.slice(1).replace("_", " ")}</td>
                                    <td>{value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}

            {/* Avis clients */}
            <ProductReviews productId={product.id} />

            {/* Cross-sell : produits similaires */}
            {related.length > 0 && (
                <ScrollReveal as="section" className="product-page__related">
                    <h2>Vous aimerez aussi</h2>
                    <div className="product-page__related-grid">
                        {related.map((p) => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </div>
                </ScrollReveal>
            )}

            {/* Sticky CTA mobile : visible UNIQUEMENT quand le CTA inline est hors ecran */}
            {product.stock > 0 && !inlineCtaVisible && (
                <div className="product-sticky-cta" role="region" aria-label="Ajouter au panier">
                    <div className="product-sticky-cta__price">
                        {formatPrice(product.price)}
                    </div>
                    <button className="btn btn--primary" onClick={addToCart}>
                        <ShoppingCart size={18} /> {added ? "Ajoute" : "Ajouter au panier"}
                    </button>
                </div>
            )}
        </div>
    )
}
