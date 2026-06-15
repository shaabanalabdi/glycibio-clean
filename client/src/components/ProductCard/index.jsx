import { useState } from "react"
import { Link } from "react-router-dom"
import { ShoppingCart, Heart, Check } from "lucide-react"
import { ProductImage } from "@components/ProductImage/index.jsx"
import { IgMeter } from "@components/IgMeter/index.jsx"
import { useAuthenticated } from "@hooks/useAuthenticated.js"
import { useCart } from "@hooks/useCart.js"
import { useWishlist } from "@hooks/useWishlist.js"
import { formatPrice } from "@utils/formatPrice.js"

// Libelle de bande IG — aligne sur les seuils du composant IgMeter
// (<= 55 bas, 56-69 modere, 70+ eleve).
const IG_BAND = {
    bas: "Indice bas",
    moyen: "Indice modéré",
    eleve: "Indice élevé"
}

export const ProductCard = ({ product }) => {
    const igClass = product.ig_category || "bas"
    const { authUser } = useAuthenticated()
    const { addToCart: addCart } = useCart()
    const { has, toggle } = useWishlist()
    const [added, setAdded] = useState(false)
    const outOfStock = product.stock !== undefined && product.stock <= 0
    const lowStock =
        !outOfStock && product.stock !== undefined && product.stock <= 5
    const inWishlist = has(product.id)

    const toggleWishlist = async (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!authUser) return
        await toggle(product.id)
    }

    const addToCart = async (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (outOfStock) return

        const { ok } = await addCart(product, 1)
        if (ok) {
            setAdded(true)
            setTimeout(() => setAdded(false), 2000)
        }
    }

    return (
        <article
            className={`product-card${outOfStock ? " product-card--out-of-stock" : ""}`}
            data-ig={igClass}
        >
            {/* Stretched link : toute la carte navigue vers la fiche produit,
                SANS imbriquer de <button> dans un <a> (HTML valide). Les
                boutons (coeur / Ajouter) passent au-dessus via z-index. */}
            <Link
                to={`/produit/${product.slug || product.id}`}
                className="product-card__overlay"
                aria-label={product.name}
                viewTransition
            />

            <div className="product-card__image">
                <ProductImage
                    url={product.image}
                    alt={product.name}
                    preset="card"
                    width="800"
                    height="800"
                    loading="lazy"
                    decoding="async"
                    fallback={
                        <div className="product-card__placeholder">
                            Image indisponible
                        </div>
                    }
                />

                {authUser && (
                    <button
                        type="button"
                        className={`product-card__wishlist${inWishlist ? " product-card__wishlist--active" : ""}`}
                        onClick={toggleWishlist}
                        aria-pressed={inWishlist}
                        aria-label={
                            inWishlist
                                ? "Retirer des favoris"
                                : "Ajouter aux favoris"
                        }
                        title={
                            inWishlist
                                ? "Retirer des favoris"
                                : "Ajouter aux favoris"
                        }
                    >
                        <Heart
                            size={18}
                            aria-hidden="true"
                            fill={inWishlist ? "currentColor" : "none"}
                        />
                    </button>
                )}

                <span
                    className={`product-card__badge badge-ig badge-ig--${igClass}`}
                >
                    IG {product.glycemic_index}
                </span>

                {outOfStock && (
                    <span className="product-card__out-of-stock">
                        Rupture de stock
                    </span>
                )}
            </div>

            <div className="product-card__body">
                <div className="product-card__info">
                    {product.category_name && (
                        <p className="product-card__category">
                            {product.category_name}
                        </p>
                    )}

                    <h3 className="product-card__name">{product.name}</h3>

                    {/* Bande signature : l'index glycemique reste le differenciateur */}
                    <div className="product-card__ig">
                        <div className="product-card__ig-head">
                            <span className="product-card__ig-label">
                                <span
                                    className="product-card__ig-dot"
                                    aria-hidden="true"
                                />
                                {IG_BAND[igClass]}
                            </span>
                        </div>
                        <IgMeter ig={product.glycemic_index} size="sm" />
                    </div>

                    {lowStock && (
                        <p className="product-card__low-stock">
                            Plus que {product.stock} en stock&nbsp;!
                        </p>
                    )}
                </div>

                <div className="product-card__footer">
                    <p className="product-card__price">
                        {formatPrice(product.price)}
                    </p>

                    {outOfStock ? (
                        <button
                            type="button"
                            className="product-card__add product-card__add--disabled"
                            disabled
                            aria-label={`${product.name} indisponible`}
                        >
                            <span>Indisponible</span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            className={`product-card__add${added ? " product-card__add--added" : ""}`}
                            onClick={addToCart}
                            aria-label={`Ajouter ${product.name} au panier`}
                        >
                            {added ? (
                                <>
                                    <Check size={16} aria-hidden="true" />
                                    <span>Ajouté</span>
                                </>
                            ) : (
                                <>
                                    <ShoppingCart size={16} aria-hidden="true" />
                                    <span>Ajouter</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </article>
    )
}
