import { useEffect, useRef, useState } from "react"
import { Plus } from "lucide-react"
import {
    useGetAdminCategoriesQuery,
    useCreateCategoryMutation,
    useUpdateCategoryMutation,
    useDeleteCategoryMutation
} from "@slices/adminApiSlice.js"
import { Skeleton } from "@components/Skeleton/index.jsx"

const truncate = (text, max = 90) => (!text ? "" : text.length <= max ? text : `${text.slice(0, max)}...`)

const emptyForm = { id: null, name: "", description: "" }

// Onglet "Categories" : formulaire d'edition + tableau de gestion.
// Donnees via RTK Query (adminApiSlice) : l'invalidation du tag "adminCategories"
// rafraichit automatiquement le tableau apres creation / mise a jour / suppression.
export const AdminCategories = () => {
    const { data: categories = [], isLoading, isError, refetch } = useGetAdminCategoriesQuery()
    const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation()
    const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation()
    const [deleteCategory] = useDeleteCategoryMutation()

    const [categoryForm, setCategoryForm] = useState(emptyForm)
    const [busyCategoryId, setBusyCategoryId] = useState(null)
    const [notice, setNotice] = useState({ type: "", text: "" })
    const [formOpen, setFormOpen] = useState(false)
    const formRef = useRef(null)
    const addBtnRef = useRef(null)

    const savingCategory = isCreating || isUpdating

    const resetForm = () => setCategoryForm(emptyForm)

    useEffect(() => {
        if (formOpen && formRef.current) {
            const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
            formRef.current.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })
            formRef.current.querySelector("input, select, textarea")?.focus()
        }
    }, [formOpen, categoryForm.id])

    const openCreate = () => {
        resetForm()
        setFormOpen(true)
    }

    const closeForm = () => {
        resetForm()
        setFormOpen(false)
        addBtnRef.current?.focus()
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        const payload = { name: categoryForm.name.trim(), description: categoryForm.description.trim() || null }
        try
        {
            if (categoryForm.id) {
                await updateCategory({ id: categoryForm.id, ...payload }).unwrap()
            } else {
                await createCategory(payload).unwrap()
            }
            setNotice({ type: "success", text: categoryForm.id ? "Categorie mise a jour." : "Categorie creee." })
            resetForm()
            setFormOpen(false)
            addBtnRef.current?.focus()
        }
        catch (error)
        {
            setNotice({ type: "error", text: error?.data?.message || "Impossible de sauvegarder la categorie." })
        }
    }

    const handleEdit = (category) => {
        setCategoryForm({ id: category.id, name: category.name || "", description: category.description || "" })
        setFormOpen(true)
    }

    const handleDelete = async (category) => {
        if (!window.confirm(`Supprimer la categorie "${category.name}" ?`)) return
        setBusyCategoryId(category.id)
        try
        {
            await deleteCategory(category.id).unwrap()
            setNotice({ type: "success", text: "Categorie supprimee." })
        }
        catch (error)
        {
            setNotice({ type: "error", text: error?.data?.message || "Suppression categorie impossible." })
        }
        setBusyCategoryId(null)
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
                <p className="admin-panel__empty">Impossible de charger les categories.</p>
                <button type="button" className="btn btn--outline" onClick={() => refetch()}>
                    Reessayer
                </button>
            </div>
        )
    }

    return (
        <div className="admin-panel">
            {notice.text && (
                <p className={`admin-console__notice admin-console__notice--${notice.type || "info"}`} role={notice.type === "error" ? "alert" : "status"} aria-live={notice.type === "error" ? "assertive" : "polite"}>
                    {notice.text}
                </p>
            )}
            <header className="admin-head">
                <div className="admin-head__titles">
                    <h2>Gestion des categories <span className="admin-count-badge">{categories.length}</span></h2>
                    <p className="admin-head__subtitle">Familles de produits du catalogue.</p>
                </div>
                <div className="admin-head__controls">
                    <button type="button" className="btn btn--primary" onClick={openCreate} ref={addBtnRef}>
                        <Plus size={16} aria-hidden="true" /> Ajouter
                    </button>
                </div>
            </header>
            {formOpen && (
                <form
                    className="admin-form-card"
                    ref={formRef}
                    onSubmit={(event) => { void handleSubmit(event) }}
                >
                    <h3>{categoryForm.id ? `Modifier categorie #${categoryForm.id}` : "Ajouter une categorie"}</h3>
                    <div className="admin-form-grid">
                        <label className="admin-field">
                            <span>Nom *</span>
                            <input
                                type="text"
                                value={categoryForm.name}
                                onChange={(event) => setCategoryForm((prev) => ({ ...prev, name: event.target.value }))}
                                required
                            />
                        </label>
                        <label className="admin-field admin-field--wide">
                            <span>Description</span>
                            <textarea
                                rows="3"
                                value={categoryForm.description}
                                onChange={(event) => setCategoryForm((prev) => ({ ...prev, description: event.target.value }))}
                            />
                        </label>
                    </div>
                    <div className="admin-actions">
                        <button type="submit" className="btn btn--primary" disabled={savingCategory}>
                            {savingCategory ? "Sauvegarde..." : categoryForm.id ? "Mettre a jour" : "Creer la categorie"}
                        </button>
                        <button type="button" className="btn btn--outline" onClick={closeForm}>Annuler</button>
                    </div>
                </form>
            )}

            <div className="admin-table-wrap">
                    <table>
                        <thead><tr><th>Nom</th><th>Description</th><th>Produits</th><th>Actifs</th><th className="admin-col-actions">Actions</th></tr></thead>
                        <tbody>
                            {categories.map((category) => (
                                <tr key={category.id}>
                                    <td><strong>{category.name}</strong></td>
                                    <td>{truncate(category.description, 90)}</td>
                                    <td>{category.products_count ?? 0}</td>
                                    <td>{category.active_products_count ?? 0}</td>
                                    <td className="admin-col-actions">
                                        <div className="admin-inline-actions">
                                            <button type="button" className="btn btn--outline" onClick={() => handleEdit(category)}>Modifier</button>
                                            <button
                                                type="button"
                                                className="btn btn--outline admin-danger"
                                                onClick={() => { void handleDelete(category) }}
                                                disabled={busyCategoryId === category.id}
                                            >
                                                {busyCategoryId === category.id ? "..." : "Supprimer"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {categories.length === 0 && (
                                <tr><td colSpan="5" className="admin-empty-cell">Aucune categorie disponible.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
        </div>
    )
}
