import "./style.scss"
import { useState, useEffect, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"
import { Trash2, Plus, Minus, ShoppingBag, Check, Lock, ArrowLeft } from "lucide-react"
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
import { FREE_SHIPPING_THRESHOLD, VAT_RATE } from "@utils/constants.js"
import { igLevelOf, IG_LEVEL_LABELS } from "@utils/ig.js"
import { CartItemSkeleton } from "@components/Skeleton/index.jsx"
import { IgMeter } from "@components/IgMeter/index.jsx"
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

// Moyenne IG du panier ponderee par la quantite (cote client, a partir du
// champ glycemic_index deja present sur chaque item). Renvoie null si aucun
// item ne porte d'IG -> la box "Charge glycemique" est alors masquee.
const computeAvgIg = (items) => {
    let weighted = 0
    let qtySum = 0
    items.forEach((item) => {
        const ig = Number(item.glycemic_index)
        const qty = Number(item.quantity) || 0
        if (Number.isFinite(ig) && qty > 0) {
            weighted += ig * qty
            qtySum += qty
        }
    })
    if (qtySum === 0) return null
    return Math.round(weighted / qtySum)
}

const IG_VERDICTS = {
    bas:   "excellent équilibre",
    moyen: "équilibre correct",
    eleve: "à surveiller"
}
// igLevelOf + libelles : importes de @utils/ig.js (source unique de verite).

export const Cart = () => {
    const { isAuthenticated, isUserLoading } = useAuthenticated()
    const isGuest = !isAuthenticated
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const [guestCart, setGuestCart] = useState(emptyCart)
    const [guestLoading, setGuestLoading] = useState(true)
    const [errors, setErrors] = useState({})
    const [brokenImages, setBrokenImages] = useState(() => new Set())
    const [confirmingId, setConfirmingId] = useState(null)   // retrait : confirmation en 2 temps

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
    // refresh=true (montage) : rafraichit prix/stock depuis l'API.
    // refresh=false (mutation +/-/suppression) : reutilise les snapshots deja
    // stockes en localStorage -> AUCUNE requete reseau. Corrige la tempete N+1
    // (1 requete par article a CHAQUE changement de quantite).
    const loadGuestCart = useCallback(async ({ refresh = true } = {}) => {
        const guestItems = getGuestCart()
        if (guestItems.length === 0) {
            setGuestCart(emptyCart)
            setGuestLoading(false)
            return
        }

        const source = refresh
            ? await Promise.all(
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
            : guestItems   // snapshots existants, zero appel reseau

        const items = source.map(guestItemToDisplay)
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
                await loadGuestCart({ refresh: false })
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
            await loadGuestCart({ refresh: false })
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
                <div className="cart__stepper" aria-hidden="true">
                    <div className="cart__brand">
                        <img src="/icon-512.png" alt="" width="32" height="32" />
                        <span>GlyciBio</span>
                    </div>
                    <ol className="cart-stepper">
                        <li className="cart-stepper__step cart-stepper__step--active">
                            <span className="cart-stepper__num">1</span>
                            <span className="cart-stepper__label">Panier</span>
                        </li>
                        <li className="cart-stepper__line" />
                        <li className="cart-stepper__step">
                            <span className="cart-stepper__num">2</span>
                            <span className="cart-stepper__label">Livraison</span>
                        </li>
                        <li className="cart-stepper__line" />
                        <li className="cart-stepper__step">
                            <span className="cart-stepper__num">3</span>
                            <span className="cart-stepper__label">Paiement</span>
                        </li>
                    </ol>
                    <span className="cart__secure"><Lock size={16} aria-hidden="true" /> Sécurisé</span>
                </div>
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

    // ----- Derives client-side (affichage uniquement) -----
    const avgIg = computeAvgIg(cart.items)
    const avgLevel = avgIg != null ? igLevelOf(avgIg) : null
    const allLow = cart.items.every((it) => {
        const ig = Number(it.glycemic_index)
        return Number.isFinite(ig) && ig <= 55
    })
    const subtotalNum = parseFloat(cart.total) || 0
    const freeShipping = subtotalNum >= FREE_SHIPPING_THRESHOLD
    const vatNum = subtotalNum * (VAT_RATE / (1 + VAT_RATE))   // part de TVA incluse (prix TTC)

    return (
        <div className="cart">
            <div className="cart__stepper">
                <div className="cart__brand">
                    <img src="/icon-512.png" alt="" width="32" height="32" />
                    <span>GlyciBio</span>
                </div>
                <ol className="cart-stepper" aria-label="Etapes de la commande">
                    <li className="cart-stepper__step cart-stepper__step--active" aria-current="step">
                        <span className="cart-stepper__num">1</span>
                        <span className="cart-stepper__label">Panier</span>
                    </li>
                    <li className="cart-stepper__line" aria-hidden="true" />
                    <li className="cart-stepper__step">
                        <span className="cart-stepper__num">2</span>
                        <span className="cart-stepper__label">Livraison</span>
                    </li>
                    <li className="cart-stepper__line" aria-hidden="true" />
                    <li className="cart-stepper__step">
                        <span className="cart-stepper__num">3</span>
                        <span className="cart-stepper__label">Paiement</span>
                    </li>
                </ol>
                <span className="cart__secure"><Lock size={16} aria-hidden="true" /> Sécurisé</span>
            </div>

            <div className="cart__content">
                <div className="cart__items">
                    <header className="cart__items-head">
                        <h1>Votre panier</h1>
                        <p className="cart__items-sub">
                            {cart.itemCount} article{cart.itemCount > 1 ? "s" : ""}
                            {allLow && " · tous à index glycémique bas"}
                        </p>
                    </header>

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
                                {item.category_name && (
                                    <p className="cart-item__category">{item.category_name}</p>
                                )}
                                <p className="cart-item__name">{item.name}</p>
                                {item.glycemic_index != null && (
                                    <div className="cart-item__ig">
                                        <IgMeter ig={item.glycemic_index} size="sm" />
                                        {item.ig_category && (
                                            <span className={`badge-ig badge-ig--${item.ig_category}`}>
                                                IG {item.glycemic_index}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="cart-item__aside">
                                <p className="cart-item__subtotal">
                                    {formatPrice(item.subtotal)}
                                </p>

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
                            </div>

                            {confirmingId === item.id ? (
                                <div className="cart-item__confirm" role="group" aria-label={`Confirmer le retrait de ${item.name}`}>
                                    <span className="cart-item__confirm-q">Retirer&nbsp;?</span>
                                    <button
                                        type="button"
                                        className="cart-item__confirm-yes"
                                        onClick={() => { setConfirmingId(null); removeItem(item) }}
                                    >
                                        Oui
                                    </button>
                                    <button
                                        type="button"
                                        className="cart-item__confirm-no"
                                        onClick={() => setConfirmingId(null)}
                                    >
                                        Non
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    className="cart-item__remove"
                                    onClick={() => setConfirmingId(item.id)}
                                    aria-label={`Retirer ${item.name} du panier`}
                                >
                                    <Trash2 size={18} aria-hidden="true" />
                                </button>
                            )}

                            {errors[item.id] && (
                                <p className="cart-item__error" role="alert">
                                    {errors[item.id]}
                                </p>
                            )}
                        </div>
                    ))}

                    <Link to="/catalogue" className="cart__continue">
                        <ArrowLeft size={18} aria-hidden="true" />
                        Continuer mes achats
                    </Link>
                </div>

                <div className="cart__summary">
                    <h2 className="cart__summary-title">Récapitulatif</h2>

                    {avgIg != null && (
                        <div className={`cart__ig-load cart__ig-load--${avgLevel}`}>
                            <p className="cart__ig-load-label">
                                <Check size={16} aria-hidden="true" />
                                Charge glycémique du panier
                            </p>
                            <IgMeter ig={avgIg} size="sm" />
                            <p className="cart__ig-load-verdict">
                                IG moyen <strong>{avgIg}</strong> · {IG_LEVEL_LABELS[avgLevel]?.toLowerCase()} — {IG_VERDICTS[avgLevel]}
                            </p>
                        </div>
                    )}

                    {(() => {
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
                        {/* Coherent avec Checkout : le port n'est offert qu'au-dela
                            du seuil ; sinon il est calcule a l'etape Livraison. */}
                        <span className={freeShipping ? "cart__summary-free" : ""}>
                            {freeShipping ? "Offerte" : "Calculée à l'étape suivante"}
                        </span>
                    </div>
                    <div className="cart__summary-line">
                        <span>TVA incluse</span>
                        <span>{formatPrice(vatNum)}</span>
                    </div>

                    <form
                        className="cart__promo"
                        onSubmit={(e) => e.preventDefault()}
                    >
                        <input
                            type="text"
                            className="cart__promo-input"
                            placeholder="Code promo"
                            aria-label="Code promo"
                        />
                        <button type="submit" className="cart__promo-apply">Appliquer</button>
                    </form>

                    <div className="cart__summary-total">
                        <span>Total</span>
                        <span>{formatPrice(cart.total)}</span>
                    </div>

                    <button type="button" className="btn btn--primary btn--full cart__checkout" onClick={handleCheckoutClick}>
                        {isGuest ? "Se connecter pour commander" : "Passer la commande"}
                    </button>

                    {isGuest && (
                        <p className="cart__guest-hint">
                            Pas encore de compte ? <Link to="/register?next=/commande">Inscription rapide</Link>.
                            Votre panier sera conserve.
                        </p>
                    )}

                    <div className="cart__payments" aria-label="Moyens de paiement acceptés">
                        <span>VISA</span>
                        <span>MASTERCARD</span>
                        <span>PAYPAL</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
