import { useState } from "react"
import {
    useGetAdminShippingQuery,
    useCreateShippingMethodMutation,
    useUpdateShippingMethodMutation,
    useDeleteShippingMethodMutation
} from "@slices/adminApiSlice.js"
import { Skeleton } from "@components/Skeleton/index.jsx"
import { formatPrice } from "@utils/formatPrice"

const emptyForm = { id: null, name: "", price: "", estimated_days: "", is_active: true }

// Onglet "Modes de livraison" : formulaire + tableau + toggle actif/inactif.
// Donnees via RTK Query (invalidation auto du tag "adminShipping").
export const AdminShipping = () => {
    const { data: shippingMethods = [], isLoading, isError, refetch } = useGetAdminShippingQuery()
    const [createShippingMethod, { isLoading: isCreating }] = useCreateShippingMethodMutation()
    const [updateShippingMethod, { isLoading: isUpdating }] = useUpdateShippingMethodMutation()
    const [deleteShippingMethod] = useDeleteShippingMethodMutation()

    const [shippingForm, setShippingForm] = useState(emptyForm)
    const [busyShippingId, setBusyShippingId] = useState(null)
    const [notice, setNotice] = useState({ type: "", text: "" })

    const savingShipping = isCreating || isUpdating
    const resetForm = () => setShippingForm(emptyForm)

    const handleSubmit = async (event) => {
        event.preventDefault()
        const payload = {
            name: shippingForm.name.trim(),
            price: Number(shippingForm.price),
            estimated_days: Number(shippingForm.estimated_days),
            is_active: !!shippingForm.is_active
        }
        try
        {
            if (shippingForm.id) {
                await updateShippingMethod({ id: shippingForm.id, ...payload }).unwrap()
            } else {
                await createShippingMethod(payload).unwrap()
            }
            setNotice({ type: "success", text: shippingForm.id ? "Mode de livraison mis a jour." : "Mode de livraison cree." })
            resetForm()
        }
        catch (error)
        {
            setNotice({ type: "error", text: error?.data?.message || "Erreur sur le mode de livraison." })
        }
    }

    const handleEdit = (method) => {
        setShippingForm({
            id: method.id,
            name: method.name || "",
            price: method.price ?? "",
            estimated_days: method.estimated_days ?? "",
            is_active: !!method.is_active
        })
    }

    const handleToggle = async (method) => {
        const label = method.is_active ? "desactiver" : "reactiver"
        if (!window.confirm(`Voulez-vous ${label} "${method.name}" ?`)) return
        setBusyShippingId(method.id)
        try
        {
            if (method.is_active) {
                await deleteShippingMethod(method.id).unwrap()
            } else {
                await updateShippingMethod({ id: method.id, is_active: true }).unwrap()
            }
            setNotice({ type: "success", text: method.is_active ? "Mode de livraison desactive." : "Mode de livraison reactive." })
        }
        catch (error)
        {
            setNotice({ type: "error", text: error?.data?.message || "Action impossible." })
        }
        setBusyShippingId(null)
    }

    if (isLoading) {
        return (
            <div className="admin-panel" aria-busy="true">
                <Skeleton width="260px" height="1.75rem" />
                <Skeleton width="100%" height="220px" style={{ marginTop: "1rem" }} />
            </div>
        )
    }

    if (isError) {
        return (
            <div className="admin-panel">
                <p className="admin-panel__empty">Impossible de charger les modes de livraison.</p>
                <button type="button" className="btn btn--outline" onClick={() => refetch()}>Reessayer</button>
            </div>
        )
    }

    return (
        <div className="admin-panel">
            {notice.text && (
                <p className={`admin-console__notice admin-console__notice--${notice.type || "info"}`}>
                    {notice.text}
                </p>
            )}
            <h2>Modes de livraison</h2>
            <div className="admin-split admin-split--balanced">
                <form
                    className="admin-form-card"
                    onSubmit={(event) => { void handleSubmit(event) }}
                >
                    <h3>{shippingForm.id ? `Modifier mode #${shippingForm.id}` : "Ajouter un mode de livraison"}</h3>
                    <div className="admin-form-grid">
                        <label className="admin-field">
                            <span>Nom *</span>
                            <input
                                type="text"
                                value={shippingForm.name}
                                onChange={(event) => setShippingForm((prev) => ({ ...prev, name: event.target.value }))}
                                required
                            />
                        </label>
                        <label className="admin-field">
                            <span>Prix *</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={shippingForm.price}
                                onChange={(event) => setShippingForm((prev) => ({ ...prev, price: event.target.value }))}
                                required
                            />
                        </label>
                        <label className="admin-field">
                            <span>Delai estime (jours) *</span>
                            <input
                                type="number"
                                min="1"
                                step="1"
                                value={shippingForm.estimated_days}
                                onChange={(event) => setShippingForm((prev) => ({ ...prev, estimated_days: event.target.value }))}
                                required
                            />
                        </label>
                        {shippingForm.id && (
                            <label className="admin-checkbox">
                                <input
                                    type="checkbox"
                                    checked={shippingForm.is_active}
                                    onChange={(event) => setShippingForm((prev) => ({ ...prev, is_active: event.target.checked }))}
                                />
                                <span>Mode actif</span>
                            </label>
                        )}
                    </div>
                    <div className="admin-actions">
                        <button type="submit" className="btn btn--primary" disabled={savingShipping}>
                            {savingShipping ? "Sauvegarde..." : shippingForm.id ? "Mettre a jour" : "Creer le mode"}
                        </button>
                        <button type="button" className="btn btn--outline" onClick={resetForm}>Reinitialiser</button>
                    </div>
                </form>

                <div className="admin-table-wrap">
                    <table>
                        <thead><tr><th>Nom</th><th>Prix</th><th>Delai</th><th>Statut</th><th>Actions</th></tr></thead>
                        <tbody>
                            {shippingMethods.map((method) => (
                                <tr key={method.id}>
                                    <td><strong>{method.name}</strong></td>
                                    <td>{formatPrice(method.price)}</td>
                                    <td>{method.estimated_days} jours</td>
                                    <td>
                                        <span className={`admin-status ${method.is_active ? "admin-status--payee" : "admin-status--annulee"}`}>
                                            {method.is_active ? "Actif" : "Inactif"}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="admin-inline-actions">
                                            <button type="button" className="btn btn--outline" onClick={() => handleEdit(method)}>Modifier</button>
                                            <button
                                                type="button"
                                                className="btn btn--outline admin-danger"
                                                onClick={() => { void handleToggle(method) }}
                                                disabled={busyShippingId === method.id}
                                            >
                                                {busyShippingId === method.id ? "..." : method.is_active ? "Desactiver" : "Reactiver"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {shippingMethods.length === 0 && (
                                <tr><td colSpan="5" className="admin-empty-cell">Aucun mode de livraison disponible.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
