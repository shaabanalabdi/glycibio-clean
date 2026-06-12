import "./style.scss"
import { Link } from "react-router-dom"
import { ShieldCheck, Leaf, Truck, Heart, ArrowRight, Sparkles } from "lucide-react"
import { ProductCard } from "@components/ProductCard/index.jsx"
import { ProductCardSkeleton } from "@components/Skeleton/index.jsx"
import { ScrollReveal } from "@components/ScrollReveal/index.jsx"
import { useAuthenticated } from "@hooks/useAuthenticated.js"
import { useDocumentMeta } from "@hooks/useDocumentMeta.js"
import { useGetCategoriesQuery } from "@slices/categoryApiSlice.js"
import { useGetProductsQuery } from "@slices/productApiSlice.js"

export const Home = () => {
    const { authUser } = useAuthenticated()

    useDocumentMeta({
        title: "GlyciBio - Aliments a index glycemique controle | Livraison France",
        description: "Selection d'aliments sains a index glycemique bas ou modere. Alternatives naturelles au sucre, livraison 48h en France metropolitaine.",
        canonical: "https://glycibio.fr/"
    })

    const { data: categories = [] } = useGetCategoriesQuery()
    const { data: featuredData, isLoading: loading } = useGetProductsQuery({ limit: 4, sort: "ig_asc" })
    const featuredProducts = featuredData?.products ?? []

    return (
        <div className="home">
            {/* Hero - decorative orbs + eyebrow chip + refined CTA cluster */}
            <section className="hero">
                <div className="hero__orb hero__orb--a" aria-hidden="true" />
                <div className="hero__orb hero__orb--b" aria-hidden="true" />
                <div className="hero__content">
                    <span className="hero__eyebrow">
                        <Sparkles size={14} aria-hidden="true" />
                        Selection 2026 - Index glycemique controle
                    </span>
                    <h1 className="hero__title">
                        Mangez sain,<br />
                        <span className="hero__highlight">controlez votre glycemie</span>
                    </h1>
                    <p className="hero__text">
                        Decouvrez notre selection d&apos;aliments a index glycemique controle.
                        Des produits naturels, sains et delicieux pour votre bien-etre quotidien.
                    </p>
                    <div className="hero__actions">
                        <Link to="/catalogue" className="btn btn--primary btn--lg hero__cta-primary">
                            Voir le catalogue
                            <ArrowRight size={18} aria-hidden="true" />
                        </Link>
                        {!authUser && (
                            <Link to="/register" className="btn btn--outline btn--lg hero__cta-secondary">
                                Creer un compte
                            </Link>
                        )}
                    </div>
                    <ul className="hero__trust" aria-label="Garanties GlyciBio">
                        <li><ShieldCheck size={14} aria-hidden="true" /> Paiement securise</li>
                        <li><Truck size={14} aria-hidden="true" /> Livraison 48h</li>
                        <li><Leaf size={14} aria-hidden="true" /> Selection bio</li>
                    </ul>
                </div>
            </section>

            {/* Avantages */}
            <ScrollReveal as="section" className="features">
                <div className="features__grid">
                    <div className="features__item">
                        <Leaf size={32} />
                        <h3>100% Naturel</h3>
                        <p>Produits selectionnes pour leur qualite nutritionnelle</p>
                    </div>
                    <div className="features__item">
                        <ShieldCheck size={32} />
                        <h3>IG Controle</h3>
                        <p>Chaque produit affiche son index glycemique verifie</p>
                    </div>
                    <div className="features__item">
                        <Truck size={32} />
                        <h3>Livraison rapide</h3>
                        <p>Livraison en 24h a 72h partout en France</p>
                    </div>
                    <div className="features__item">
                        <Heart size={32} />
                        <h3>Bien-etre</h3>
                        <p>Pour diabetiques, sportifs et soucieux de leur sante</p>
                    </div>
                </div>
            </ScrollReveal>

            {/* Categories */}
            <ScrollReveal as="section" className="home-categories" delay={50}>
                <h2 className="section-title">Nos Categories</h2>
                <div className="home-categories__grid">
                    {categories.map((cat) => (
                        <Link
                            key={cat.id}
                            to={`/catalogue?category=${cat.id}`}
                            className="category-card"
                        >
                            <span className="category-card__icon">🌿</span>
                            <h3>{cat.name}</h3>
                            {cat.description && <p>{cat.description}</p>}
                        </Link>
                    ))}
                </div>
            </ScrollReveal>

            {/* Produits vedettes */}
            <ScrollReveal as="section" className="home-products" delay={100}>
                <h2 className="section-title">Produits a faible IG</h2>
                <p className="section-subtitle">Les meilleurs produits avec un index glycemique bas</p>
                <div className="home-products__grid" aria-busy={loading}>
                    {loading
                        ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
                        : featuredProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                </div>
                <div className="home-products__cta">
                    <Link to="/catalogue" className="btn btn--outline">
                        Voir tous les produits
                        <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                </div>
            </ScrollReveal>
        </div>
    )
}
