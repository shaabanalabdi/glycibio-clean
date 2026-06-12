import "./style.scss"
import { useState, useEffect, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react"
import { useAuthenticated } from "@hooks/useAuthenticated.js"
import {
    useGetCartQuery,
    useUpdateCartItemMutation,
    useRemoveCartItemMutation
} from "@slices/cartApiSlice.js"
import { productApiSlice } from "@slices/productApiSlice.js"
import { resolveImageUrl } from "@utils/imageUrl.js"
import { buildSrcset, SRCSET_PRESETS } from "@utils/imageSrcset.js"
import { formatPrice } from "@utils/formatPrice.js"
import { CartItemSkeleton } from "@components/Skeleton/index.jsx"
import {
    getGuestCart,
    setGuestCartItemQuantity,
    removeGuestCartItem,
    refreshGuestCartSnapshot
} from "@utils/guestCart.js"

const emptyCart = { items: [], total: "0.00", itemCount: 0 }

// Convertit le format guest cart en format API (compatible avec le rendu actuel).
// Items API : { id, product_id, name, price, image, stock, glycemic_index, ig_category, subtotal, quantity }
// Items guest : { product_id, quantity, snapshot: {...} }
const guestItemToDisplay = (item) => {
    const s = item.snapshot || {}
    const price = Number(s.price) || 0
    return {
        id: item.product_id,        // identifiant logique pour les boutons +/-/x
        product_id: item.product_id,
        name: s.name || "Produit",
        price,
        image: s.image,
        stock: s.stock,
        glycemic_index: s.glycemic_index,
        ig_category: s.ig_category || "bas",
        quantity: item.quantity,
        subtotal: (price * item.quantity).toFixed(2)
    }
}

const computeTotal = (items) =>
    items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0).toFixed(2)

export const Cart = () => {
    const { isAuthenticated, isUserLoading } = useAuthenticated()
    const isGuest = !isAuthenticated
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const [guestCart, setGuestCart] = useState(emptyCart)
    const [guestLoading, setGuestLoading] = useState(true)
    const [errors, setErrors] = useState({})
    const [brokenImages, setBrokenImages] = useState(() => new Set())

    // ----- Panier serveur (utilisateur connecte) via RTK Query -----
    const {
        data: serverCart,
        isLoading: serverLoading,
        isError: serverError,
        refetch
    } = useGetCartQuery(undefined, { skip: isGuest })
    const [updateCartItem] = useUpdateCartItemMutation()
    const [removeCartItem] = useRemoveCartItemMutation()

    // ----- Panier guest (localStorage) -----
    const loadGuestCart = useCallback(async () => {
        const guestItems = getGuestCart()
        if (guestItems.length === 0) {
            setGuestCart(emptyCart)
            setGuestLoading(false)
            return
        }

        // Rafraichit les snapshots depuis l'API (prix / stock recent) en parallele
        const refreshed = await Promise.all(
            guestItems.map(async (it) => {
                try
                {
                    const product = await dispatch(
                        productApiSlice.endpoints.getProduct.initiate(it.product_id, { forceRefetch: true })
                    ).unwrap()
                    refreshGuestCartSnapshot(it.product_id, product)
                    return {
                        ...it,
                        snapshot: {
                            name: product.name,
                            price: product.price,
                            image: product.image,
                            stock: product.stock,
                            glycemic_index: product.glycemic_index,
                            ig_category: product.ig_category,
                            slug: product.slug
                        }
                    }
                }
                catch
                {
                    return it
                }
            })
        )

        const items = refreshed.map(guestItemToDisplay)
        const total = computeTotal(items)
        const itemCount = items.reduce((sum, it) => sum + it.quantity, 0)
        setGuestCart({ items, total, itemCount })
        setGuestLoading(false)
    }, [dispatch])

    useEffect(() => {
        if (isUserLoading || !isGuest) return undefined
        let isMounted = true
        setGuestLoading(true)
        const run = async () => {
            if (isMounted) await loadGuestCart()
        }
        run()
        return () => {
            isMounted = false
        }
    }, [isGuest, isUserLoading, loadGuestCart])

    const cart = isGuest ? guestCart : (serverCart ?? emptyCart)
    const loading = isUserLoading || (isGuest ? guestLoading : serverLoading)
    const loadError = !isGuest && serverError

    // ----- Mutations -----
    const updateQuantity = async (item, newQuantity) => {
        if (newQuantity < 1) return
        const stock = item.stock
        if (typeof stock === "number" && newQuantity > stock) {
            setErrors((prev) => ({ ...prev, [item.id]: `Stock limite a ${stock} unite(s).` }))
            return
        }
        setErrors((prev) => {
            const { [item.id]: _, ...rest } = prev
            return rest
        })

        if (isGuest) {
            const res = setGuestCartItemQuantity(item.product_id, newQuantity, stock)
            if (res.ok) {
                await loadGuestCart()
            } else {
                setErrors((prev) => ({ ...prev, [item.id]: res.message || "Erreur de mise a jour." }))
            }
            return
        }

        try
        {
            // L'invalidation du tag "cart" rafraichit automatiquement le panier
            await updateCartItem({ id: item.id, quantity: newQuantity }).unwrap()
        }
        catch (error)
        {
            setErrors((prev) => ({ ...prev, [item.id]: error?.data?.message || "Erreur de mise a jour." }))
        }
    }

    const removeItem = async (item) => {
        if (isGuest) {
            removeGuestCartItem(item.product_id)
            await loadGuestCart()
            return
        }
        try
        {
            await removeCartItem(item.id).unwrap()
        }
        catch
        {
            // best-effort : le panier reste inchange si la suppression echoue
        }
    }

    // Click sur "Passer la commande" : guest -> login avec returnTo, sinon -> /commande
    const handleCheckoutClick = () => {
        if (isGuest) {
            navigate("/login?next=/commande")
            return
        }
        navigate("/commande")
    }

    if (loading) {
        return (
            <div className="cart" aria-busy="true">
                <h1>Mon Panier</h1>
                <div className="cart__content">
                    <div className="cart__items">
                        <CartItemSkeleton />
                        <CartItemSkeleton />
                        <CartItemSkeleton />
                    </div>
                </div>
            </div>
        )
    }

    if (loadError) {
        return (
            <div className="cart-empty">
                <ShoppingBag size={64} />
                <h2>Impossible de charger votre panier</h2>
                <p>Un probleme de connexion est survenu. Reessayez dans un instant.</p>
                <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => refetch()}
                >
                    Reessayer
                </button>
            </div>
        )
    }

    if (cart.items.length === 0) {
        return (
            <div className="cart-empty">
                <ShoppingBag size={64} />
                <h2>Votre panier est vide</h2>
                <p>Decouvrez nos produits et ajoutez-les a votre panier</p>
                <Link to="/catalogue" className="btn btn--primary">Voir le catalogue</Link>
            </div>
        )
    }

    return (
        <div className="cart">
            <h1>Mon Panier ({cart.itemCount} article{cart.itemCount > 1 ? "s" : ""})</h1>

            <div className="cart__content">
                <div className="cart__items">
                    {cart.items.map((item) => (
                        <div key={item.id} className="cart-item">
                            <div className="cart-item__image">
                                {item.image && !brokenImages.has(item.id) ? (
                                    <img
                                        src={resolveImageUrl(item.image)}
                                        srcSet={buildSrcset(item.image, SRCSET_PRESETS.cartItem) || undefined}
                                        sizes={SRCSET_PRESETS.cartItem.sizes}
                                        alt={item.name}
                                        width="80"
                                        height="80"
                                        loading="lazy"
                                        decoding="async"
                                        onError={() => setBrokenImages((prev) => {
                                            if (prev.has(item.id)) return prev
                                            const next = new Set(prev)
                                            next.add(item.id)
                                            return next
                                        })}
                                    />
                                ) : (
                                    <div className="cart-item__placeholder">Image indisponible</div>
                                )}
                            </div>

                            <div className="cart-item__info">
                                <h3>{item.name}</h3>
                                {item.glycemic_index != null && item.ig_category && (
                                    <span className={`badge-ig badge-ig--${item.ig_category}`}>
                                        IG {item.glycemic_index}
                                    </span>
                                )}
                                <p className="cart-item__price">{formatPrice(item.price)}</p>
                            </div>

                            <div className="cart-item__quantity">
                                <button
                                    type="button"
                                    onClick={() => updateQuantity(item, item.quantity - 1)}
                                    disabled={item.quantity <= 1}
                                    aria-label="Reduire la quantite"
                                >
                                    <Minus size={16} aria-hidden="true" />
                                </button>
                                <span aria-live="polite">{item.quantity}</span>
                                <button
                                    type="button"
                                    onClick={() => updateQuantity(item, item.quantity + 1)}
                                    disabled={typeof item.stock === "number" && item.quantity >= item.stock}
                                    aria-label="Augmenter la quantite"
                                >
                                    <Plus size={16} aria-hidden="true" />
                                </button>
                            </div>

                            <p className="cart-item__subtotal">
                                {formatPrice(item.subtotal)}
                            </p>

                            <button
                                type="button"
                                className="cart-item__remove"
                                onClick={() => removeItem(item)}
                                aria-label={`Retirer ${item.name} du panier`}
                            >
                                <Trash2 size={18} aria-hidden="true" />
                            </button>

                            {errors[item.id] && (
                                <p className="cart-item__error" role="alert">
                                    {errors[item.id]}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                <div className="cart__summary">
                    <h3>Resume</h3>

                    {(() => {
                        const FREE_SHIPPING_THRESHOLD = 49
                        const subtotal = parseFloat(cart.total) || 0
                        const remaining = FREE_SHIPPING_THRESHOLD - subtotal
                        if (remaining > 0) {
                            const pct = Math.max(5, Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100))
                            return (
                                <div className="cart__free-shipping">
                                    <p>
                                        Plus que <strong>{formatPrice(remaining)}</strong> pour la livraison gratuite !
                                    </p>
                                    <div className="cart__free-shipping-bar" aria-hidden="true">
                                        <div className="cart__free-shipping-bar-fill" style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            )
                        }
                        return (
                            <p className="cart__free-shipping cart__free-shipping--unlocked">
                                Livraison standard <strong>gratuite</strong> !
                            </p>
                        )
                    })()}

                    <div className="cart__summary-line">
                        <span>Sous-total</span>
                        <span>{formatPrice(cart.total)}</span>
                    </div>
                    <div className="cart__summary-line">
                        <span>Livraison</span>
                        <span>Calculee a l&apos;etape suivante</span>
                    </div>
                    <div className="cart__summary-total">
                        <span>Total</span>
                        <span>{formatPrice(cart.total)}</span>
                    </div>

                    <button type="button" className="btn btn--primary btn--full" onClick={handleCheckoutClick}>
                        {isGuest ? "Se connecter pour commander" : "Passer la commande"}
                    </button>

                    {isGuest && (
                        <p className="cart__guest-hint">
                            Pas encore de compte ? <Link to="/register?next=/commande">Inscription rapide</Link>.
                            Votre panier sera conserve.
                        </p>
                    )}

                    <Link to="/catalogue" className="cart__continue">
                        Continuer les achats
                    </Link>
                </div>
            </div>
        </div>
    )
}
