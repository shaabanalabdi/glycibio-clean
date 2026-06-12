// Primitives skeleton (placeholders animes pendant le chargement).
// Respecte prefers-reduced-motion (animation desactivee si requis).
// Reserve la place finale du contenu -> pas de CLS (Core Web Vitals).

export const Skeleton = ({ width, height, radius, className = "", style }) => {
    return (
        <span
            className={`skeleton ${className}`}
            style={{
                width,
                height,
                borderRadius: radius,
                ...style
            }}
            aria-hidden="true"
        />
    )
}

// Skeleton specifique a une product-card (image carree + 3 lignes de texte)
export const ProductCardSkeleton = () => {
    return (
        <div className="product-card product-card--skeleton" aria-hidden="true">
            <div className="product-card__image skeleton" />
            <div className="product-card__info">
                <span className="skeleton skeleton--line" style={{ width: "40%" }} />
                <span className="skeleton skeleton--line" style={{ width: "85%" }} />
                <span className="skeleton skeleton--line" style={{ width: "60%" }} />
                <span className="skeleton skeleton--line" style={{ width: "30%", marginTop: "0.75rem" }} />
            </div>
        </div>
    )
}

// Grille de cards (catalogue / home)
export const ProductCardGridSkeleton = ({ count = 8 }) => {
    return (
        <div className="catalog__grid" role="status" aria-label="Chargement des produits">
            {Array.from({ length: count }).map((_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    )
}

// Une ligne d'article dans le panier
export const CartItemSkeleton = () => {
    return (
        <div className="cart-item cart-item--skeleton" aria-hidden="true">
            <div className="cart-item__image skeleton" />
            <div className="cart-item__info">
                <span className="skeleton skeleton--line" style={{ width: "75%" }} />
                <span className="skeleton skeleton--line" style={{ width: "35%" }} />
            </div>
        </div>
    )
}
