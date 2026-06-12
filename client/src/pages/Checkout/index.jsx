import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { MapPin, Truck, CreditCard } from "lucide-react"
import { useAuthenticated } from "@hooks/useAuthenticated.js"
import { useCart } from "@hooks/useCart.js"
import { useGetCartQuery } from "@slices/cartApiSlice.js"
import { useGetShippingMethodsQuery } from "@slices/shippingApiSlice.js"
import { useCreateCheckoutMutation } from "@slices/paymentApiSlice.js"
import { useCreateOrderMutation } from "@slices/orderApiSlice.js"
import {
    parseStoredAddress,
    validateAddress,
    composeShippingAddress
} from "@utils/address.js"
import { formatPrice } from "@utils/formatPrice.js"

const emptyCart = { items: [], total: "0.00" }

export const Checkout = () => {
    const { authUser } = useAuthenticated()
    const [identity, setIdentity] = useState({
        first_name: authUser?.first_name || "",
        last_name: authUser?.last_name || "",
        phone: authUser?.phone || ""
    })
    const [address, setAddress] = useState(parseStoredAddress(authUser?.address))
    const [shippingMethodId, setShippingMethodId] = useState(null)
    const [cgvAccepted, setCgvAccepted] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const navigate = useNavigate()
    const { resetCart, refreshCartCount } = useCart()

    const { data: cartData, isLoading: cartLoading } = useGetCartQuery()
    const { data: shippingData, isLoading: shippingLoading } = useGetShippingMethodsQuery()
    const [createCheckout] = useCreateCheckoutMutation()
    const [createOrder] = useCreateOrderMutation()

    const cart = cartData ?? emptyCart
    const shippingMethods = shippingData ?? []
    const loading = cartLoading || shippingLoading

    const selectedShipping = shippingMethods.find((m) => m.id === shippingMethodId)
    const shippingCost = selectedShipping ? parseFloat(selectedShipping.price) : 0
    const total = (parseFloat(cart.total) + shippingCost).toFixed(2)

    const handleAddressChange = (field) => (e) =>
        setAddress((prev) => ({ ...prev, [field]: e.target.value }))

    const handleIdentityChange = (field) => (e) =>
        setIdentity((prev) => ({ ...prev, [field]: e.target.value }))

    const validate = () => {
        if (!identity.first_name.trim() || !identity.last_name.trim()) {
            return "Veuillez completer tous les champs obligatoires"
        }
        const err = validateAddress(address, { phone: identity.phone })
        if (err) return err
        if (!shippingMethodId) return "Veuillez selectionner un mode de livraison"
        if (!cgvAccepted) return "Vous devez accepter les Conditions Generales de Vente pour passer commande"
        return null
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")

        const validationError = validate()
        if (validationError) {
            setError(validationError)
            return
        }

        setSubmitting(true)

        const payload = {
            shipping_address: composeShippingAddress(address, identity),
            shipping_method_id: shippingMethodId,
            cgv_accepted: true
        }

        try
        {
            const { checkout_url } = await createCheckout(payload).unwrap()
            if (checkout_url) {
                resetCart()
                window.location.href = checkout_url
                return
            }
            setSubmitting(false)
            setError("Erreur lors de la creation de la commande")
        }
        catch (checkoutError)
        {
            // Stripe indisponible (503) : bascule sur la creation de commande directe
            if (checkoutError?.status === 503) {
                try
                {
                    await createOrder(payload).unwrap()
                    setSubmitting(false)
                    resetCart()
                    refreshCartCount()
                    setSuccess(true)
                }
                catch (orderError)
                {
                    setSubmitting(false)
                    setError(orderError?.data?.message || "Erreur lors de la creation de la commande")
                }
                return
            }

            setSubmitting(false)
            setError(checkoutError?.data?.message || "Erreur lors de la creation de la commande")
        }
    }

    useEffect(() => {
        if (!loading && !success && cart.items.length === 0) {
            navigate("/panier", { replace: true })
        }
    }, [loading, success, cart.items.length, navigate])

    if (loading) return <p className="page-loading">Chargement...</p>
    if (cart.items.length === 0 && !success) return null

    if (success) {
        return (
            <div className="checkout-success">
                <div className="checkout-success__icon">&#10003;</div>
                <h1>Commande confirmee !</h1>
                <p>Merci pour votre commande. Vous recevrez un email de confirmation.</p>
                <button onClick={() => navigate("/catalogue")} className="btn btn--primary btn--lg">
                    Continuer les achats
                </button>
            </div>
        )
    }

    const addressFilled = address.street && address.postal_code && address.city
        && identity.first_name && identity.last_name && identity.phone
    const shippingFilled = !!shippingMethodId

    return (
        <div className="checkout">
            <h1>Passer la commande</h1>

            <ol className="checkout-steps" aria-label="Etapes de la commande">
                <li className={`checkout-steps__step ${addressFilled ? "checkout-steps__step--done" : "checkout-steps__step--active"}`}>
                    <span className="checkout-steps__num">1</span>
                    <span className="checkout-steps__label">Adresse</span>
                </li>
                <li className={`checkout-steps__step ${shippingFilled ? "checkout-steps__step--done" : addressFilled ? "checkout-steps__step--active" : ""}`}>
                    <span className="checkout-steps__num">2</span>
                    <span className="checkout-steps__label">Livraison</span>
                </li>
                <li className={`checkout-steps__step ${shippingFilled && addressFilled ? "checkout-steps__step--active" : ""}`}>
                    <span className="checkout-steps__num">3</span>
                    <span className="checkout-steps__label">Paiement</span>
                </li>
            </ol>

            <div className="checkout__content">
                <form onSubmit={handleSubmit} className="checkout__form" noValidate>
                    {error && <p className="checkout__error">{error}</p>}

                    {/* Etape 1: Adresse */}
                    <section className="checkout__step">
                        <h2><MapPin size={20} /> Adresse de livraison</h2>

                        <div className="checkout__row checkout__row--3">
                            <div className="checkout__field checkout__field--narrow">
                                <label htmlFor="civility">Civilite</label>
                                <select
                                    id="civility"
                                    value={address.civility}
                                    onChange={handleAddressChange("civility")}
                                >
                                    <option value="M.">M.</option>
                                    <option value="Mme">Mme</option>
                                </select>
                            </div>
                            <div className="checkout__field">
                                <label htmlFor="first_name">Prenom <span aria-hidden="true">*</span></label>
                                <input
                                    id="first_name"
                                    type="text"
                                    autoComplete="given-name"
                                    value={identity.first_name}
                                    onChange={handleIdentityChange("first_name")}
                                    required
                                />
                            </div>
                            <div className="checkout__field">
                                <label htmlFor="last_name">Nom <span aria-hidden="true">*</span></label>
                                <input
                                    id="last_name"
                                    type="text"
                                    autoComplete="family-name"
                                    value={identity.last_name}
                                    onChange={handleIdentityChange("last_name")}
                                    required
                                />
                            </div>
                        </div>

                        <div className="checkout__field">
                            <label htmlFor="phone">Telephone <span aria-hidden="true">*</span></label>
                            <input
                                id="phone"
                                type="tel"
                                autoComplete="tel"
                                inputMode="tel"
                                placeholder="06 12 34 56 78"
                                value={identity.phone}
                                onChange={handleIdentityChange("phone")}
                                required
                            />
                            <small className="checkout__hint">Utilise par le livreur en cas de besoin.</small>
                        </div>

                        <div className="checkout__field">
                            <label htmlFor="street">Numero et nom de rue <span aria-hidden="true">*</span></label>
                            <input
                                id="street"
                                type="text"
                                autoComplete="address-line1"
                                placeholder="12 rue de la Paix"
                                value={address.street}
                                onChange={handleAddressChange("street")}
                                required
                            />
                        </div>

                        <div className="checkout__field">
                            <label htmlFor="complement">Complement d&apos;adresse</label>
                            <input
                                id="complement"
                                type="text"
                                autoComplete="address-line2"
                                placeholder="Appartement, batiment, etage, residence (optionnel)"
                                value={address.complement}
                                onChange={handleAddressChange("complement")}
                            />
                        </div>

                        <div className="checkout__row checkout__row--2">
                            <div className="checkout__field checkout__field--narrow">
                                <label htmlFor="postal_code">Code postal <span aria-hidden="true">*</span></label>
                                <input
                                    id="postal_code"
                                    type="text"
                                    autoComplete="postal-code"
                                    inputMode="numeric"
                                    pattern="\d{5}"
                                    maxLength={5}
                                    placeholder="75002"
                                    value={address.postal_code}
                                    onChange={handleAddressChange("postal_code")}
                                    required
                                />
                            </div>
                            <div className="checkout__field">
                                <label htmlFor="city">Ville <span aria-hidden="true">*</span></label>
                                <input
                                    id="city"
                                    type="text"
                                    autoComplete="address-level2"
                                    placeholder="Paris"
                                    value={address.city}
                                    onChange={handleAddressChange("city")}
                                    required
                                />
                            </div>
                        </div>

                    </section>

                    {/* Etape 2: Mode de livraison */}
                    <section className="checkout__step">
                        <h2><Truck size={20} /> Mode de livraison</h2>
                        <div className="checkout__shipping-options">
                            {shippingMethods.map((method) => (
                                <label
                                    key={method.id}
                                    className={`checkout__shipping-option ${
                                        shippingMethodId === method.id ? "checkout__shipping-option--selected" : ""
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="shipping"
                                        checked={shippingMethodId === method.id}
                                        onChange={() => setShippingMethodId(method.id)}
                                    />
                                    <div>
                                        <strong>{method.name}</strong>
                                        <p>{method.description}</p>
                                    </div>
                                    <span className="checkout__shipping-price">
                                        {parseFloat(method.price) === 0 ? "Gratuit" : formatPrice(method.price)}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </section>

                    {/* Etape 3: Confirmer */}
                    <section className="checkout__step">
                        <h2><CreditCard size={20} /> Recapitulatif</h2>
                        <div className="checkout__recap">
                            {cart.items.map((item) => (
                                <div key={item.id} className="checkout__recap-item">
                                    <span>{item.name} x{item.quantity}</span>
                                    <span>{formatPrice(item.subtotal)}</span>
                                </div>
                            ))}
                            <div className="checkout__recap-line">
                                <span>Sous-total</span>
                                <span>{formatPrice(cart.total)}</span>
                            </div>
                            <div className="checkout__recap-line">
                                <span>Livraison</span>
                                <span>{shippingCost === 0 ? "Gratuit" : formatPrice(shippingCost)}</span>
                            </div>
                            <div className="checkout__recap-total">
                                <span>Total</span>
                                <span>{formatPrice(total)}</span>
                            </div>
                        </div>

                        <label className="checkout__cgv">
                            <input
                                type="checkbox"
                                checked={cgvAccepted}
                                onChange={(e) => setCgvAccepted(e.target.checked)}
                                required
                            />
                            <span>
                                J&apos;ai lu et j&apos;accepte les{" "}
                                <Link to="/cgv" target="_blank" rel="noopener noreferrer">
                                    Conditions Generales de Vente
                                </Link>
                                {" "}et la{" "}
                                <Link to="/politique-confidentialite" target="_blank" rel="noopener noreferrer">
                                    politique de confidentialite
                                </Link>
                                . Je reconnais que ma commande est avec obligation de paiement.
                            </span>
                        </label>

                        <button
                            type="submit"
                            className="btn btn--primary btn--full btn--lg"
                            disabled={submitting || !cgvAccepted}
                        >
                            {submitting ? "Traitement..." : "Commander avec obligation de paiement"}
                        </button>

                        <div className="checkout__trust" aria-label="Garanties et paiement securise">
                            <p className="checkout__trust-headline">
                                Paiement 100% securise - Aucune donnee bancaire stockee chez GlyciBio
                            </p>
                            <div className="checkout__trust-badges">
                                <span className="trust-badge trust-badge--stripe">Stripe</span>
                                <span className="trust-badge trust-badge--visa">VISA</span>
                                <span className="trust-badge trust-badge--mc">Mastercard</span>
                                <span className="trust-badge trust-badge--ssl">SSL</span>
                            </div>
                            <ul className="checkout__trust-list">
                                <li>Livraison en France 48-72h</li>
                                <li>Retour gratuit sous 14 jours (droit de retractation)</li>
                                <li>Service client : contact@glycibio.fr</li>
                            </ul>
                        </div>
                    </section>
                </form>
            </div>
        </div>
    )
}
