import "./style.scss"
import { useState, useEffect, useRef } from "react"
import { useParams, Link } from "react-router-dom"
import { ShoppingCart, ArrowLeft, Minus, Plus, Truck, ShieldCheck } from "lucide-react"
import { ProductCard } from "@components/ProductCard/index.jsx"
import { ProductGallery } from "@components/ProductGallery/index.jsx"
import { ProductReviews } from "@components/ProductReviews/index.jsx"
import { Breadcrumb } from "@components/Breadcrumb/index.jsx"
import { ScrollReveal } from "@components/ScrollReveal/index.jsx"
import { IgMeter } from "@components/IgMeter/index.jsx"
import { useCart } from "@hooks/useCart.js"
import { useDocumentMeta } from "@hooks/useDocumentMeta.js"
import { useGetProductQuery, useGetRelatedProductsQuery } from "@slices/productApiSlice.js"
import { formatPrice } from "@utils/formatPrice.js"

const SITE_BASE = "https://glycibio.fr"

// Libelle FR du niveau IG, derive de ig_category (donnee reelle du produit)
const IG_LABELS = { bas: "BAS", moyen: "MODÉRÉ", eleve: "ÉLEVÉ" }

export const Product = () => {
    const { id } = useParams()
    const { addToCart: addCart } = useCart()
    const [quantity, setQuantity] = useState(1)
    const [added, setAdded] = useState(false)
    const [submitting, setSubmitting] = useState(false)
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
        if (submitting) return
        setError("")
        setSubmitting(true)
        try
        {
            const { ok, message } = await addCart(product, quantity)
            if (ok) {
                setAdded(true)
                setTimeout(() => setAdded(false), 3000)
            } else {
                setError(message || "Erreur d'ajout au panier")
            }
        }
        finally
        {
            setSubmitting(false)
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
    const igLabel = IG_LABELS[igClass] || IG_LABELS.bas
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
                    <span className={`product-page__ig-pill badge-ig badge-ig--${igClass}`}>
                        IG {product.glycemic_index} · {igLabel}
                    </span>
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
                    {product.category_name && (
                        <div className="product-page__pills">
                            <span className="product-page__pill product-page__pill--cat">
                                {product.category_name}
                            </span>
                        </div>
                    )}
                    <h1 className="product-page__name">{product.name}</h1>

                    {/* Grande carte Index glycemique (signature) */}
                    <div className="product-page__ig-card">
                        <div className="product-page__ig-head">
                            <span className="product-page__ig-card-label">Index glycémique</span>
                            <span className="product-page__ig-number">
                                {product.glycemic_index}
                                <span className="product-page__ig-out">/ 100</span>
                            </span>
                        </div>
                        <IgMeter ig={product.glycemic_index} size="lg" showScale />
                        <p className="product-page__ig-explainer">
                            Un IG de {product.glycemic_index} signifie une montée de la glycémie
                            {igClass === "bas" ? " lente et faible" : igClass === "moyen" ? " modérée" : " rapide et forte"}
                            {igClass === "bas" ? " — idéal en remplacement du sucre blanc (IG 70)." : "."}
                        </p>
                    </div>

                    {/* Tableau nutritionnel — 3 stat cards */}
                    {Object.keys(nutrition).length > 0 && (
                        <div className="product-page__nutrition-row">
                            {Object.entries(nutrition).map(([key, value]) => (
                                <div className="product-page__stat" key={key}>
                                    <span className="product-page__stat-value">{value}</span>
                                    <span className="product-page__stat-label">
                                        {key.charAt(0).toUpperCase() + key.slice(1).replace("_", " ")}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

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

                    {/* Buy row : prix + stepper + CTA */}
                    <div className="product-page__buy">
                        <div className="product-page__price-block">
                            <span className="product-page__price">{formatPrice(product.price)}</span>
                            <span className="product-page__stock">
                                {product.stock > 0 ? (
                                    <span className="product-page__stock--available">En stock ({product.stock} disponibles)</span>
                                ) : (
                                    <span className="product-page__stock--out">Rupture de stock</span>
                                )}
                            </span>
                        </div>

                        {/* Ajouter au panier */}
                        {product.stock > 0 && (
                            <div className="product-page__cart" ref={inlineCtaRef}>
                                {error && <p className="product-page__error" role="alert">{error}</p>}

                                <div className="product-page__quantity">
                                    <button aria-label="Diminuer la quantité" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                                        <Minus size={18} />
                                    </button>
                                    <span aria-live="polite">{quantity}</span>
                                    <button aria-label="Augmenter la quantité" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>
                                        <Plus size={18} />
                                    </button>
                                </div>

                                <button
                                    className={`btn btn--primary btn--lg ${added ? "btn--success" : ""}`}
                                    onClick={addToCart}
                                    disabled={submitting}
                                    aria-busy={submitting}
                                >
                                    {submitting ? (
                                        "Ajout…"
                                    ) : added ? (
                                        "Ajouté au panier"
                                    ) : (
                                        <><ShoppingCart size={20} /> Ajouter au panier</>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Ligne de confiance : livraison + stock */}
                    <ul className="product-page__trust">
                        <li><Truck size={18} aria-hidden="true" /> Livraison rapide en 24/48h</li>
                        <li><ShieldCheck size={18} aria-hidden="true" /> Paiement sécurisé · Bio certifié</li>
                    </ul>
                </div>
            </div>

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
                    <button className="btn btn--primary" onClick={addToCart} disabled={submitting} aria-busy={submitting}>
                        <ShoppingCart size={18} /> {submitting ? "Ajout…" : added ? "Ajouté" : "Ajouter au panier"}
                    </button>
                </div>
            )}
        </div>
    )
}
