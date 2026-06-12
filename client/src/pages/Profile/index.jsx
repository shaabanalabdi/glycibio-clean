import "./style.scss"
import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { ShoppingBag, LogOut } from "lucide-react"
import { useAuthenticated } from "@hooks/useAuthenticated.js"
import {
    useUpdateProfileMutation,
    useChangePasswordMutation,
    useDeleteAccountMutation
} from "@slices/userApiSlice.js"
import { useGetOrdersQuery, useCancelOrderMutation } from "@slices/orderApiSlice.js"
import { EmptyState } from "@components/EmptyState/index.jsx"
import { parseStoredAddress, serializeAddress, validateAddress } from "@utils/address.js"
import { formatPrice } from "@utils/formatPrice.js"

const STATUS_LABELS = {
    en_attente:     "En attente",
    payee:          "Payee",
    en_preparation: "En preparation",
    expediee:       "Expediee",
    livree:         "Livree",
    annulee:        "Annulee"
}

export const Profile = () => {
    const { authUser, logout, reqAuthCheck } = useAuthenticated()
    const navigate = useNavigate()

    // Formulaire profil
    const [profile, setProfile] = useState({
        first_name: authUser?.first_name || "",
        last_name:  authUser?.last_name  || "",
        phone:      authUser?.phone      || ""
    })
    const [address, setAddress] = useState(parseStoredAddress(authUser?.address))
    const [profileMsg, setProfileMsg] = useState({ text: "", ok: true })

    // Formulaire mot de passe
    const [passwords, setPasswords] = useState({
        current_password: "",
        new_password: "",
        confirm_password: ""
    })
    const [passwordMsg, setPasswordMsg] = useState({ text: "", ok: true })

    // Historique commandes via RTK Query
    const {
        data: orders = [],
        isLoading: ordersLoading,
        isError: ordersIsError,
        error: ordersQueryError
    } = useGetOrdersQuery()
    const ordersError = ordersIsError
        ? (ordersQueryError?.data?.message || "Impossible de charger vos commandes")
        : ""

    const [updateProfile] = useUpdateProfileMutation()
    const [changePassword] = useChangePasswordMutation()
    const [deleteAccount] = useDeleteAccountMutation()
    const [cancelOrder] = useCancelOrderMutation()

    // Suppression compte
    const [deletePassword, setDeletePassword] = useState("")
    const [deleteMsg, setDeleteMsg] = useState("")
    const [showDelete, setShowDelete] = useState(false)

    const addressIsEmpty = !address.street.trim()
        && !address.postal_code.trim()
        && !address.city.trim()
        && !address.complement.trim()

    // --- Modifier profil ---
    const handleProfileSubmit = async (e) => {
        e.preventDefault()
        setProfileMsg({ text: "", ok: true })

        if (!addressIsEmpty) {
            const err = validateAddress(address)
            if (err) {
                setProfileMsg({ text: err, ok: false })
                return
            }
        }

        const payload = {
            ...profile,
            address: addressIsEmpty ? null : serializeAddress(address)
        }

        try
        {
            await updateProfile(payload).unwrap()
            setProfileMsg({ text: "Profil mis a jour !", ok: true })
            // Resynchronise l'utilisateur en cache (remplace l'ancien updateUser)
            reqAuthCheck()
        }
        catch (err)
        {
            setProfileMsg({ text: err?.data?.message, ok: false })
        }
    }

    const handleAddressChange = (field) => (e) =>
        setAddress((prev) => ({ ...prev, [field]: e.target.value }))

    // --- Changer mot de passe ---
    const handlePasswordSubmit = async (e) => {
        e.preventDefault()
        setPasswordMsg({ text: "", ok: true })

        if (passwords.new_password !== passwords.confirm_password) {
            setPasswordMsg({ text: "Les mots de passe ne correspondent pas", ok: false })
            return
        }

        try
        {
            await changePassword({
                current_password: passwords.current_password,
                new_password: passwords.new_password
            }).unwrap()
            setPasswordMsg({ text: "Mot de passe modifie !", ok: true })
            setPasswords({ current_password: "", new_password: "", confirm_password: "" })
        }
        catch (err)
        {
            setPasswordMsg({ text: err?.data?.message, ok: false })
        }
    }

    // --- Annuler commande ---
    const handleCancelOrder = async (orderId) => {
        if (!window.confirm("Etes-vous sur de vouloir annuler cette commande ?")) return
        try
        {
            // L'invalidation du tag "orders" rafraichit automatiquement la liste
            await cancelOrder(orderId).unwrap()
        }
        catch (err)
        {
            alert(err?.data?.message || "Erreur lors de l'annulation")
        }
    }

    // --- Se deconnecter ---
    const handleLogout = async () => {
        await logout()
        navigate("/")
    }

    // --- Supprimer compte ---
    const handleDelete = async () => {
        try
        {
            await deleteAccount({ password: deletePassword }).unwrap()
            logout()
            navigate("/")
        }
        catch (err)
        {
            setDeleteMsg(err?.data?.message)
        }
    }

    return (
        <div className="profile">
            <h1>Mon Profil</h1>

            {/* Section : Informations */}
            <section className="profile__section">
                <h2>Mes informations</h2>
                <p className="profile__email">Email : {authUser?.email}</p>
                <p className="profile__role">Compte : {authUser?.role}</p>

                <button
                    type="button"
                    onClick={handleLogout}
                    className="btn btn--outline profile__logout"
                >
                    <LogOut size={18} aria-hidden="true" /> Se deconnecter
                </button>

                <form onSubmit={handleProfileSubmit}>
                    {profileMsg.text && (
                        <p className={`profile__msg${profileMsg.ok ? "" : " profile__msg--error"}`}>
                            {profileMsg.text}
                        </p>
                    )}

                    <div className="profile__row">
                        <div className="profile__field">
                            <label>Prenom</label>
                            <input
                                type="text"
                                value={profile.first_name}
                                onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                            />
                        </div>
                        <div className="profile__field">
                            <label>Nom</label>
                            <input
                                type="text"
                                value={profile.last_name}
                                onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="profile__field">
                        <label>Telephone</label>
                        <input
                            type="tel"
                            value={profile.phone}
                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                            placeholder="+33 6 12 34 56 78"
                        />
                    </div>

                    <fieldset className="profile__fieldset">
                        <legend>Adresse de livraison par defaut</legend>
                        <p className="profile__fieldset-hint">
                            Ces informations seront preremplies lors de vos prochaines commandes.
                        </p>

                        <div className="profile__field profile__field--narrow">
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

                        <div className="profile__field">
                            <label htmlFor="street">Numero et nom de rue</label>
                            <input
                                id="street"
                                type="text"
                                autoComplete="address-line1"
                                placeholder="12 rue de la Paix"
                                value={address.street}
                                onChange={handleAddressChange("street")}
                            />
                        </div>

                        <div className="profile__field">
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

                        <div className="profile__row profile__row--postal">
                            <div className="profile__field profile__field--narrow">
                                <label htmlFor="postal_code">Code postal</label>
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
                                />
                            </div>
                            <div className="profile__field">
                                <label htmlFor="city">Ville</label>
                                <input
                                    id="city"
                                    type="text"
                                    autoComplete="address-level2"
                                    placeholder="Paris"
                                    value={address.city}
                                    onChange={handleAddressChange("city")}
                                />
                            </div>
                        </div>
                    </fieldset>

                    <button type="submit" className="btn btn--primary">Enregistrer</button>
                </form>
            </section>

            {/* Section : Mot de passe */}
            <section className="profile__section">
                <h2>Changer le mot de passe</h2>

                <form onSubmit={handlePasswordSubmit}>
                    {passwordMsg.text && (
                        <p className={`profile__msg${passwordMsg.ok ? "" : " profile__msg--error"}`}>
                            {passwordMsg.text}
                        </p>
                    )}

                    <div className="profile__field">
                        <label>Mot de passe actuel</label>
                        <input
                            type="password"
                            value={passwords.current_password}
                            onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })}
                            required
                        />
                    </div>

                    <div className="profile__field">
                        <label>Nouveau mot de passe</label>
                        <input
                            type="password"
                            value={passwords.new_password}
                            onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                            required
                            minLength={12}
                        />
                        <small>Min. 12 caracteres, 1 majuscule, 1 chiffre, 1 special</small>
                    </div>

                    <div className="profile__field">
                        <label>Confirmer</label>
                        <input
                            type="password"
                            value={passwords.confirm_password}
                            onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn--primary">Changer le mot de passe</button>
                </form>
            </section>

            {/* Section : Historique commandes */}
            <section className="profile__section">
                <h2>Mes commandes</h2>

                {ordersLoading ? <p>Chargement des commandes...</p> : null}

                {!ordersLoading && ordersError ? (
                    <p className="profile__orders-error">{ordersError}</p>
                ) : null}

                {!ordersLoading && !ordersError && orders.length === 0 ? (
                    <EmptyState
                        icon={ShoppingBag}
                        size="sm"
                        title="Aucune commande pour le moment"
                        hint="Vos prochaines commandes apparaitront ici."
                        action={<Link to="/catalogue" className="btn btn--primary">Voir le catalogue</Link>}
                    />
                ) : null}

                {!ordersLoading && orders.length > 0 ? (
                    <ul className="profile__orders-list">
                        {orders.map((order) => (
                            <li key={order.id} className="profile__order-item">
                                <div>
                                    <strong>Commande #{order.id}</strong>
                                    <p>{new Date(order.created_at).toLocaleDateString("fr-FR")}</p>
                                </div>

                                <div className="profile__order-meta">
                                    <span className={`profile__order-status profile__order-status--${order.status}`}>
                                        {STATUS_LABELS[order.status] || order.status}
                                    </span>
                                    <strong>{formatPrice(order.total)}</strong>
                                    {order.status === "en_attente" && (
                                        <button
                                            className="btn btn--danger btn--sm"
                                            onClick={() => handleCancelOrder(order.id)}
                                        >
                                            Annuler
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : null}
            </section>


            {/* Section : Supprimer compte */}
            <section className="profile__section profile__section--danger">
                <h2>Zone dangereuse</h2>

                {!showDelete ? (
                    <button onClick={() => setShowDelete(true)} className="btn btn--danger">
                        Supprimer mon compte
                    </button>
                ) : (
                    <div className="profile__delete">
                        <p>Cette action est irreversible. Entrez votre mot de passe pour confirmer :</p>
                        {deleteMsg && <p className="profile__msg profile__msg--error">{deleteMsg}</p>}
                        <input
                            type="password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            placeholder="Votre mot de passe"
                        />
                        <div className="profile__delete-actions">
                            <button onClick={handleDelete} className="btn btn--danger">Confirmer la suppression</button>
                            <button onClick={() => setShowDelete(false)} className="btn btn--outline">Annuler</button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    )
}
