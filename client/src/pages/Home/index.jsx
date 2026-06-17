import "./style.scss"
import { Link } from "react-router-dom"
import {
    ShieldCheck, Leaf, Truck, Heart, ArrowRight, Sparkles, Check,
    Wheat, Carrot, Milk, CupSoda, Cookie, Candy, Soup, Pill, Droplets
} from "lucide-react"
import { ProductCard } from "@components/ProductCard/index.jsx"
import { ProductCardSkeleton } from "@components/Skeleton/index.jsx"
import { ScrollReveal } from "@components/ScrollReveal/index.jsx"
import { useAuthenticated } from "@hooks/useAuthenticated.js"
import { useDocumentMeta } from "@hooks/useDocumentMeta.js"
import { useGetCategoriesQuery } from "@slices/categoryApiSlice.js"
import { useGetProductsQuery } from "@slices/productApiSlice.js"
import { useGetSettingsQuery } from "@slices/settingApiSlice.js"
import { resolveImageUrl } from "@utils/imageUrl.js"

// Icone adaptee a chaque categorie (devine via mots-cles du nom, accents
// optionnels car la base stocke les noms sans accents). Ordre : du plus
// specifique au plus general ; fallback "feuille" (bio) si rien ne matche.
const CATEGORY_ICONS = [
    { re: /c[ée]r[ée]ale|f[ée]culent|farine|p[âa]tes|\briz\b|pain/i, Icon: Wheat },
    { re: /fruit|l[ée]gume/i, Icon: Carrot },
    { re: /laitier|\blait\b|yaourt|fromage|cr[èe]me/i, Icon: Milk },
    { re: /boisson|th[ée]|caf[ée]|\bjus\b|\beau/i, Icon: CupSoda },
    { re: /snack|en-?cas|barre|biscuit|collation/i, Icon: Cookie },
    { re: /[ée]dulcor|miel|sirop|st[ée]via/i, Icon: Droplets },
    { re: /sucr|chocolat|confiture|dessert/i, Icon: Candy },
    { re: /sal[ée]|conserve|condiment|sauce/i, Icon: Soup },
    { re: /compl[ée]ment|prot[ée]ine|vitamine|sportif/i, Icon: Pill }
]
const getCategoryIcon = (name = "") =>
    CATEGORY_ICONS.find((c) => c.re.test(name))?.Icon || Leaf

export const Home = () => {
    const { authUser } = useAuthenticated()

    useDocumentMeta({
        title: "GlyciBio - Aliments a index glycemique controle | Livraison France",
        description: "Selection d'aliments sains a index glycemique bas ou modere. Alternatives naturelles au sucre, livraison 48h en France metropolitaine.",
        canonical: "https://glycibio.fr/"
    })

    const { data: categories = [] } = useGetCategoriesQuery()
    const { data: featuredData, isLoading: loading } = useGetProductsQuery({ limit: 8, sort: "ig_asc" })
    const featuredProducts = featuredData?.products ?? []

    // Image de fond du hero, configurable depuis la console d'admin (sinon degrade).
    const { data: siteSettings } = useGetSettingsQuery()
    const heroBackground = siteSettings?.hero_background

    return (
        <div className="home">
            {/* Hero - degrade par defaut, OU image de fond configuree en admin
                (avec un voile sombre degrade pour garder le texte lisible). */}
            <section
                className={`hero${heroBackground ? " hero--has-image" : ""}`}
                style={heroBackground ? {
                    backgroundImage: `linear-gradient(90deg, rgba(20,32,26,0.82) 0%, rgba(20,32,26,0.55) 55%, rgba(20,32,26,0.30) 100%), url(${resolveImageUrl(heroBackground)})`
                } : undefined}
            >
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
                            <p className="trust-strip__title">100% Naturel</p>
                            <p>Produits selectionnes pour leur qualite nutritionnelle</p>
                        </div>
                    </div>
                    <div className="trust-strip__item">
                        <span className="trust-strip__tile trust-strip__tile--blue">
                            <ShieldCheck size={22} aria-hidden="true" />
                        </span>
                        <div className="trust-strip__copy">
                            <p className="trust-strip__title">IG Controle</p>
                            <p>Chaque produit affiche son index glycemique verifie</p>
                        </div>
                    </div>
                    <div className="trust-strip__item">
                        <span className="trust-strip__tile trust-strip__tile--green">
                            <Truck size={22} aria-hidden="true" />
                        </span>
                        <div className="trust-strip__copy">
                            <p className="trust-strip__title">Livraison rapide</p>
                            <p>Livraison en 24h a 72h partout en France</p>
                        </div>
                    </div>
                    <div className="trust-strip__item">
                        <span className="trust-strip__tile trust-strip__tile--blue">
                            <Heart size={22} aria-hidden="true" />
                        </span>
                        <div className="trust-strip__copy">
                            <p className="trust-strip__title">Bien-etre</p>
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
                            <h2 className="section-head__title">Parcourir par categorie</h2>
                        </div>
                    </div>
                    <div className="home-categories__grid">
                        {categories.map((cat) => {
                            const Icon = getCategoryIcon(cat.name)
                            return (
                                <Link
                                    key={cat.id}
                                    to={`/catalogue?category=${cat.id}`}
                                    className="category-card"
                                >
                                    <span className="category-card__icon" aria-hidden="true">
                                        <Icon size={22} strokeWidth={2} />
                                    </span>
                                    <div className="category-card__body">
                                        <h3 className="category-card__name">{cat.name}</h3>
                                        {cat.description && (
                                            <p className="category-card__desc">{cat.description}</p>
                                        )}
                                    </div>
                                    <span className="category-card__cta" aria-hidden="true">
                                        Découvrir
                                        <ArrowRight size={15} strokeWidth={2.25} />
                                    </span>
                                </Link>
                            )
                        })}
                    </div>
                </ScrollReveal>
            )}

            {/* Produits vedettes */}
            <ScrollReveal as="section" className="home-products" delay={100}>
                <div className="section-head">
                    <div>
                        <span className="section-head__eyebrow">Vedettes</span>
                        <h2 className="section-head__title">Produits a faible IG</h2>
                    </div>
                    <Link to="/catalogue" className="btn btn--outline section-head__cta">
                        Tout voir
                        <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                </div>
                <div className="home-products__grid" aria-busy={loading}>
                    {loading
                        ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
                        : featuredProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                </div>
            </ScrollReveal>
        </div>
    )
}
