import { useState } from "react"
import { Link } from "react-router-dom"
import { ShoppingCart, Heart } from "lucide-react"
import { ProductImage } from "@components/ProductImage/index.jsx"
import { IgMeter } from "@components/IgMeter/index.jsx"
import { useAuthenticated } from "@hooks/useAuthenticated.js"
import { useCart } from "@hooks/useCart.js"
import { useWishlist } from "@hooks/useWishlist.js"
import { formatPrice } from "@utils/formatPrice.js"

export const ProductCard = ({ product }) => {
    const igClass = product.ig_category || "bas"
    const { authUser } = useAuthenticated()
    const { addToCart: addCart } = useCart()
    const { has, toggle } = useWishlist()
    const [added, setAdded] = useState(false)
    const outOfStock = product.stock !== undefined && product.stock <= 0
    const inWishlist = has(product.id)

    const toggleWishlist = async (e) => {
        e.preventDefault()
        if (!authUser) return
        await toggle(product.id)
    }

    const addToCart = async (e) => {
        e.preventDefault()
        if (outOfStock) return

        const { ok } = await addCart(product, 1)
        if (ok) {
            setAdded(true)
            setTimeout(() => setAdded(false), 2000)
        }
    }

    return (
        <div className={`product-card${outOfStock ? " product-card--out-of-stock" : ""}`}>
            <div className="product-card__image">
                <ProductImage
                    url={product.image}
                    alt={product.name}
                    preset="card"
                    width="800"
                    height="800"
                    loading="lazy"
                    decoding="async"
                    fallback={<div className="product-card__placeholder">Image indisponible</div>}
                />
                <span className={`product-card__badge badge-ig badge-ig--${igClass}`}>
                    IG {product.glycemic_index}
                </span>
                {authUser && (
                    <button
                        type="button"
                        className={`product-card__wishlist ${inWishlist ? "product-card__wishlist--active" : ""}`}
                        onClick={toggleWishlist}
                        aria-pressed={inWishlist}
                        aria-label={inWishlist ? "Retirer des favoris" : "Ajouter aux favoris"}
                        title={inWishlist ? "Retirer des favoris" : "Ajouter aux favoris"}
                    >
                        <Heart size={18} fill={inWishlist ? "currentColor" : "none"} />
                    </button>
                )}
                {outOfStock && (
                    <span className="product-card__out-of-stock">Rupture de stock</span>
                )}
            </div>
            <div className="product-card__info">
                <p className="product-card__category">{product.category_name}</p>
                <h3 className="product-card__name">{product.name}</h3>
                <IgMeter ig={product.glycemic_index} size="sm" />
                <p className="product-card__price">{formatPrice(product.price)}</p>
                {!outOfStock && product.stock !== undefined && product.stock <= 5 && (
                    <p className="product-card__low-stock">Plus que {product.stock} en stock !</p>
                )}
            </div>
            <div className="product-card__actions">
                <Link to={`/produit/${product.slug || product.id}`} className="product-card__link">
                    Voir le produit
                </Link>
                {!outOfStock && (
                    <button
                        type="button"
                        className={`product-card__cart ${added ? "product-card__cart--added" : ""}`}
                        onClick={addToCart}
                        aria-label={`Ajouter ${product.name} au panier`}
                    >
                        {added ? "Ajoute" : <ShoppingCart size={18} aria-hidden="true" />}
                    </button>
                )}
            </div>
        </div>
    )
}
