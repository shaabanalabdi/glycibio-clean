import "./style.scss"
import { Link } from "react-router-dom"
import { ShieldCheck, Leaf, Truck, Heart, ArrowRight, Sparkles, Check } from "lucide-react"
import { ProductCard } from "@components/ProductCard/index.jsx"
import { ProductCardSkeleton } from "@components/Skeleton/index.jsx"
import { ScrollReveal } from "@components/ScrollReveal/index.jsx"
import { IgMeter } from "@components/IgMeter/index.jsx"
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
            {/* Hero - light gradient canvas + floating orbs + showcase card */}
            <section className="hero">
                <div className="hero__orb hero__orb--a" aria-hidden="true" />
                <div className="hero__orb hero__orb--b" aria-hidden="true" />

                <div className="hero__grid">
                    <div className="hero__content">
                        <span className="hero__eyebrow">
                            <Sparkles size={14} aria-hidden="true" />
                            Selection 2026 · Index glycemique controle
                        </span>
                        <h1 className="hero__title">
                            Mangez sain,<br />
                            <span className="hero__highlight">maitrisez votre glycemie</span>
                        </h1>
                        <p className="hero__text">
                            Une selection d&apos;aliments bio a index glycemique verifie. Chaque produit
                            affiche clairement son IG — pour les diabetiques, les sportifs et tous ceux
                            qui veillent a leur bien-etre.
                        </p>
                        <div className="hero__actions">
                            <Link to="/catalogue" className="btn btn--primary btn--lg hero__cta-primary">
                                Voir le catalogue
                                <ArrowRight size={18} aria-hidden="true" />
                            </Link>
                            {!authUser && (
                                <Link to="/register" className="btn btn--ghost btn--lg hero__cta-tertiary">
                                    Creer un compte
                                </Link>
                            )}
                        </div>
                        <ul className="hero__trust" aria-label="Garanties GlyciBio">
                            <li><Check size={16} aria-hidden="true" /> IG verifie</li>
                            <li><Truck size={16} aria-hidden="true" /> Livraison 48h</li>
                            <li><Leaf size={16} aria-hidden="true" /> Selection bio</li>
                        </ul>
                    </div>

                    {/* Showcase card - vitrine produit (statique) */}
                    <div className="hero__showcase" aria-hidden="true">
                        <article className="showcase-card">
                            <div className="showcase-card__media">
                                <div className="showcase-card__placeholder" />
                                <span className="showcase-card__ig">IG 19 · BAS</span>
                            </div>
                            <div className="showcase-card__body">
                                <p className="showcase-card__category">Sucrants naturels</p>
                                <h2 className="showcase-card__name">Sirop d&apos;agave bio</h2>
                                <IgMeter ig={19} size="md" />
                                <div className="showcase-card__buy">
                                    <span className="showcase-card__price">7,90&nbsp;€</span>
                                    <span className="showcase-card__add">Ajouter</span>
                                </div>
                            </div>
                        </article>
                    </div>
                </div>
            </section>

            {/* Trust strip */}
            <ScrollReveal as="section" className="trust-strip">
                <div className="trust-strip__grid">
                    <div className="trust-strip__item">
                        <span className="trust-strip__tile trust-strip__tile--green">
                            <Leaf size={22} aria-hidden="true" />
                        </span>
                        <div className="trust-strip__copy">
                            <h3>100% Naturel</h3>
                            <p>Produits selectionnes pour leur qualite nutritionnelle</p>
                        </div>
                    </div>
                    <div className="trust-strip__item">
                        <span className="trust-strip__tile trust-strip__tile--blue">
                            <ShieldCheck size={22} aria-hidden="true" />
                        </span>
                        <div className="trust-strip__copy">
                            <h3>IG Controle</h3>
                            <p>Chaque produit affiche son index glycemique verifie</p>
                        </div>
                    </div>
                    <div className="trust-strip__item">
                        <span className="trust-strip__tile trust-strip__tile--green">
                            <Truck size={22} aria-hidden="true" />
                        </span>
                        <div className="trust-strip__copy">
                            <h3>Livraison rapide</h3>
                            <p>Livraison en 24h a 72h partout en France</p>
                        </div>
                    </div>
                    <div className="trust-strip__item">
                        <span className="trust-strip__tile trust-strip__tile--blue">
                            <Heart size={22} aria-hidden="true" />
                        </span>
                        <div className="trust-strip__copy">
                            <h3>Bien-etre</h3>
                            <p>Pour diabetiques, sportifs et soucieux de leur sante</p>
                        </div>
                    </div>
                </div>
            </ScrollReveal>

            {/* Categories */}
            {categories.length > 0 && (
                <ScrollReveal as="section" className="home-categories" delay={50}>
                    <div className="section-head">
                        <div>
                            <span className="section-head__eyebrow">Categories</span>
                            <h3 className="section-head__title">Parcourir par categorie</h3>
                        </div>
                    </div>
                    <div className="home-categories__grid">
                        {categories.map((cat) => (
                            <Link
                                key={cat.id}
                                to={`/catalogue?category=${cat.id}`}
                                className="category-card"
                            >
                                <span className="category-card__icon" aria-hidden="true">
                                    <Leaf size={20} />
                                </span>
                                <h3>{cat.name}</h3>
                                {cat.description && <p>{cat.description}</p>}
                            </Link>
                        ))}
                    </div>
                </ScrollReveal>
            )}

            {/* Produits vedettes */}
            <ScrollReveal as="section" className="home-products" delay={100}>
                <div className="section-head">
                    <div>
                        <span className="section-head__eyebrow">Vedettes</span>
                        <h3 className="section-head__title">Produits a faible IG</h3>
                    </div>
                    <Link to="/catalogue" className="btn btn--outline section-head__cta">
                        Tout voir
                        <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                </div>
                <div className="home-products__grid" aria-busy={loading}>
                    {loading
                        ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
                        : featuredProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                </div>
            </ScrollReveal>
        </div>
    )
}
