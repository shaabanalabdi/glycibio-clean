import { useEffect, useMemo, useRef, useState } from "react"
import { Plus } from "lucide-react"
import {
    useGetAdminProductsQuery,
    useGetAdminCategoriesQuery,
    useCreateProductMutation,
    useUpdateProductMutation,
    useDeleteProductMutation,
    usePermanentDeleteProductMutation
} from "@slices/adminApiSlice.js"
import { AdminProductGallery } from "@components/AdminProductGallery/index.jsx"
import { SortableTh } from "@components/SortableTh/index.jsx"
import { Skeleton } from "@components/Skeleton/index.jsx"
import { useSortedRows } from "@hooks/useSortedRows.js"
import { resolveImageUrl } from "@utils/imageUrl"
import { formatPrice } from "@utils/formatPrice"

const emptyForm = {
    id: null,
    name: "",
    description: "",
    price: "",
    image: "",
    stock: "0",
    glycemic_index: "",
    allergensText: "",
    nutritionCalories: "",
    nutritionProteines: "",
    nutritionGlucides: "",
    nutritionLipides: "",
    nutritionFibres: "",
    category_id: "",
    is_active: true
}

const truncate = (text, max = 90) => (!text ? "" : text.length <= max ? text : `${text.slice(0, max)}...`)

const parseNutrition = (data) => {
    if (!data || typeof data !== "object") return { calories: "", proteines: "", glucides: "", lipides: "", fibres: "" }
    return {
        calories: data.calories ?? "",
        proteines: data.proteines ?? "",
        glucides: data.glucides ?? "",
        lipides: data.lipides ?? "",
        fibres: data.fibres ?? ""
    }
}

// Onglet "Produits" : filtres + formulaire complet + tableau triable.
// C'est l'onglet le plus dense (form + 20+ champs + upload + gallery).
// Donnees via RTK Query (invalidation auto du tag "adminProducts").
export const AdminProducts = () => {
    const { data: products = [], isLoading, isError, refetch } = useGetAdminProductsQuery()
    const { data: categories = [] } = useGetAdminCategoriesQuery()
    const [createProduct, { isLoading: isCreating }] = useCreateProductMutation()
    const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation()
    const [deleteProduct] = useDeleteProductMutation()
    const [permanentDeleteProduct] = usePermanentDeleteProductMutation()

    const [productForm, setProductForm] = useState(emptyForm)
    const [productImageFile, setProductImageFile] = useState(null)
    const [productImagePreview, setProductImagePreview] = useState("")
    const [productFilter, setProductFilter] = useState({ search: "", status: "all", category: "all" })
    const [productSort, setProductSort] = useState({ col: null, dir: null })
    const [busyProductId, setBusyProductId] = useState(null)
    const [notice, setNotice] = useState({ type: "", text: "" })
    const [formOpen, setFormOpen] = useState(false)
    const formRef = useRef(null)
    const addBtnRef = useRef(null)

    const savingProduct = isCreating || isUpdating

    // Le formulaire est replie par defaut (liste = contenu principal). A son
    // ouverture (Ajouter / Modifier) on le fait defiler dans la vue + focus,
    // en respectant prefers-reduced-motion (scrollIntoView({behavior}) prime
    // sur le scroll-behavior CSS, donc on resout le comportement ici).
    useEffect(() => {
        if (formOpen && formRef.current) {
            const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
            formRef.current.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })
            formRef.current.querySelector("input, select, textarea")?.focus()
        }
    }, [formOpen, productForm.id])

    const openCreate = () => {
        resetForm()
        setFormOpen(true)
    }

    // Ferme le panneau ET rend le focus au bouton "Ajouter" (sinon il tombe
    // sur <body> quand le formulaire se demonte — WCAG 2.4.3).
    const closeForm = () => {
        resetForm()
        setFormOpen(false)
        addBtnRef.current?.focus()
    }

    const setNextProductImagePreview = (nextPreview) => {
        setProductImagePreview((prev) => {
            if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev)
            return nextPreview || ""
        })
    }

    const resetForm = () => {
        setProductImageFile(null)
        setNextProductImagePreview("")
        setProductForm(emptyForm)
    }

    useEffect(() => () => {
        if (productImagePreview && productImagePreview.startsWith("blob:")) {
            URL.revokeObjectURL(productImagePreview)
        }
    }, [productImagePreview])

    const filteredProducts = useMemo(() => products.filter((product) => {
        if (productFilter.status === "active" && !product.is_active) return false
        if (productFilter.status === "inactive" && !!product.is_active) return false
        if (productFilter.category !== "all" && String(product.category_id) !== productFilter.category) return false
        if (!productFilter.search) return true
        const q = productFilter.search.toLowerCase()
        return `${product.name} ${product.description || ""} ${product.category_name || ""}`.toLowerCase().includes(q)
    }), [products, productFilter])

    const sortedProducts = useSortedRows(filteredProducts, productSort, {
        name:           (p) => p.name,
        category_name:  (p) => p.category_name,
        price:          (p) => Number(p.price),
        stock:          (p) => Number(p.stock),
        glycemic_index: (p) => Number(p.glycemic_index),
        is_active:      (p) => (p.is_active ? 1 : 0)
    })

    const buildNutrition = () => {
        const source = {
            calories: productForm.nutritionCalories,
            proteines: productForm.nutritionProteines,
            glucides: productForm.nutritionGlucides,
            lipides: productForm.nutritionLipides,
            fibres: productForm.nutritionFibres
        }
        const output = {}
        Object.entries(source).forEach(([key, value]) => {
            if (value === "" || value === null || value === undefined) return
            const parsed = Number(value)
            if (!Number.isNaN(parsed)) output[key] = parsed
        })
        return Object.keys(output).length > 0 ? output : null
    }

    const handleImageChange = (event) => {
        const file = event.target.files?.[0] || null
        setProductImageFile(file)
        if (file) {
            setNextProductImagePreview(URL.createObjectURL(file))
            return
        }
        setNextProductImagePreview(productForm.image || "")
    }

    const handleEdit = (product) => {
        const n = parseNutrition(product.nutritional_info)
        setProductImageFile(null)
        setNextProductImagePreview(product.image || "")
        setProductForm({
            id: product.id,
            name: product.name || "",
            description: product.description || "",
            price: product.price ?? "",
            image: product.image || "",
            stock: product.stock ?? 0,
            glycemic_index: product.glycemic_index ?? "",
            allergensText: Array.isArray(product.allergens) ? product.allergens.join(", ") : "",
            nutritionCalories: n.calories,
            nutritionProteines: n.proteines,
            nutritionGlucides: n.glucides,
            nutritionLipides: n.lipides,
            nutritionFibres: n.fibres,
            category_id: product.category_id ? String(product.category_id) : "",
            is_active: !!product.is_active
        })
        setFormOpen(true)
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        const payload = new FormData()
        const allergens = productForm.allergensText.split(",").map((item) => item.trim()).filter((item) => item.length > 0)
        const nutritionalInfo = buildNutrition()

        payload.append("name", productForm.name.trim())
        payload.append("description", productForm.description.trim())
        payload.append("price", String(productForm.price))
        payload.append("stock", String(productForm.stock))
        payload.append("category_id", String(productForm.category_id))
        if (productForm.glycemic_index !== "") payload.append("glycemic_index", String(productForm.glycemic_index))
        payload.append("allergens", JSON.stringify(allergens))
        if (nutritionalInfo) payload.append("nutritional_info", JSON.stringify(nutritionalInfo))
        if (productForm.id) payload.append("is_active", String(!!productForm.is_active))
        if (productImageFile) payload.append("image", productImageFile)

        try
        {
            if (productForm.id) {
                await updateProduct({ id: productForm.id, formData: payload }).unwrap()
            } else {
                await createProduct(payload).unwrap()
            }
            setNotice({ type: "success", text: productForm.id ? "Produit mis a jour." : "Produit cree avec succes." })
            resetForm()
            setFormOpen(false)
            addBtnRef.current?.focus()
        }
        catch (error)
        {
            setNotice({ type: "error", text: error?.data?.message || "Impossible de sauvegarder le produit." })
        }
    }

    const handleToggle = async (product) => {
        const label = product.is_active ? "desactiver" : "reactiver"
        if (!window.confirm(`Voulez-vous ${label} le produit "${product.name}" ?`)) return
        setBusyProductId(product.id)
        try
        {
            if (product.is_active) {
                await deleteProduct(product.id).unwrap()
            } else {
                await updateProduct({ id: product.id, formData: { is_active: true } }).unwrap()
            }
            setNotice({ type: "success", text: product.is_active ? "Produit desactive." : "Produit reactive." })
        }
        catch (error)
        {
            setNotice({ type: "error", text: error?.data?.message || "Action produit impossible." })
        }
        setBusyProductId(null)
    }

    const handleDelete = async (product) => {
        if (!window.confirm(`Supprimer DEFINITIVEMENT le produit "${product.name}" ?\n\nCette action est irreversible.`)) return
        setBusyProductId(product.id)
        try
        {
            await permanentDeleteProduct(product.id).unwrap()
            setNotice({ type: "success", text: `Produit "${product.name}" supprime definitivement.` })
        }
        catch (error)
        {
            setNotice({ type: "error", text: error?.data?.message || "Suppression impossible." })
        }
        setBusyProductId(null)
    }

    if (isLoading) {
        return (
            <div className="admin-panel" aria-busy="true">
                <Skeleton width="260px" height="1.75rem" />
                <Skeleton width="100%" height="320px" style={{ marginTop: "1rem" }} />
            </div>
        )
    }

    if (isError) {
        return (
            <div className="admin-panel">
                <p className="admin-panel__empty">Impossible de charger les produits.</p>
                <button type="button" className="btn btn--outline" onClick={() => refetch()}>Reessayer</button>
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
                    <h2>Gestion des produits <span className="admin-count-badge">{products.length}</span></h2>
                    <p className="admin-head__subtitle">Catalogue, stock, prix et visibilite.</p>
                </div>
                <div className="admin-head__controls">
                    <div className="admin-filter-inline">
                        <input
                            type="search"
                            placeholder="Rechercher un produit..."
                            value={productFilter.search}
                            onChange={(event) => setProductFilter((prev) => ({ ...prev, search: event.target.value }))}
                        />
                        <select
                            value={productFilter.status}
                            onChange={(event) => setProductFilter((prev) => ({ ...prev, status: event.target.value }))}
                        >
                            <option value="all">Tous</option>
                            <option value="active">Actifs</option>
                            <option value="inactive">Inactifs</option>
                        </select>
                        <select
                            value={productFilter.category}
                            onChange={(event) => setProductFilter((prev) => ({ ...prev, category: event.target.value }))}
                        >
                            <option value="all">Toutes categories</option>
                            {categories.map((category) => (
                                <option key={category.id} value={String(category.id)}>{category.name}</option>
                            ))}
                        </select>
                    </div>
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
                    <h3>{productForm.id ? `Modifier produit #${productForm.id}` : "Ajouter un produit"}</h3>

                    <div className="admin-form-grid">
                        <label className="admin-field">
                            <span>Nom *</span>
                            <input type="text" value={productForm.name} onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))} required />
                        </label>
                        <label className="admin-field">
                            <span>Categorie *</span>
                            <select value={productForm.category_id} onChange={(event) => setProductForm((prev) => ({ ...prev, category_id: event.target.value }))} required>
                                <option value="">Choisir</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={String(category.id)}>{category.name}</option>
                                ))}
                            </select>
                        </label>
                        <label className="admin-field">
                            <span>Prix *</span>
                            <input type="number" min="0" step="0.01" value={productForm.price} onChange={(event) => setProductForm((prev) => ({ ...prev, price: event.target.value }))} required />
                        </label>
                        <label className="admin-field">
                            <span>Stock *</span>
                            <input type="number" min="0" step="1" value={productForm.stock} onChange={(event) => setProductForm((prev) => ({ ...prev, stock: event.target.value }))} required />
                        </label>
                        <label className="admin-field">
                            <span>Index glycemique</span>
                            <input type="number" min="0" max="100" step="1" value={productForm.glycemic_index} onChange={(event) => setProductForm((prev) => ({ ...prev, glycemic_index: event.target.value }))} />
                        </label>
                        <label className="admin-field admin-field--wide">
                            <span>Image produit</span>
                            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageChange} />
                            <small>{productImageFile ? productImageFile.name : "PNG, JPG, WebP (max 5 MB)"}</small>
                        </label>
                        {(productImagePreview || productForm.image) && (
                            <div className="admin-image-preview">
                                <img src={resolveImageUrl(productImagePreview || productForm.image)} alt="Apercu image produit" />
                            </div>
                        )}
                        <label className="admin-field admin-field--wide">
                            <span>Allergenes (separes par virgules)</span>
                            <input type="text" value={productForm.allergensText} onChange={(event) => setProductForm((prev) => ({ ...prev, allergensText: event.target.value }))} placeholder="gluten, lactose" />
                        </label>
                        <label className="admin-field admin-field--wide">
                            <span>Description *</span>
                            <textarea rows="3" value={productForm.description} onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))} required />
                        </label>
                    </div>

                    <div className="admin-form-subgrid">
                        <h4>Infos nutritionnelles</h4>
                        <div className="admin-form-grid admin-form-grid--tight">
                            <label className="admin-field">
                                <span>Calories</span>
                                <input type="number" min="0" value={productForm.nutritionCalories} onChange={(event) => setProductForm((prev) => ({ ...prev, nutritionCalories: event.target.value }))} />
                            </label>
                            <label className="admin-field">
                                <span>Proteines</span>
                                <input type="number" min="0" value={productForm.nutritionProteines} onChange={(event) => setProductForm((prev) => ({ ...prev, nutritionProteines: event.target.value }))} />
                            </label>
                            <label className="admin-field">
                                <span>Glucides</span>
                                <input type="number" min="0" value={productForm.nutritionGlucides} onChange={(event) => setProductForm((prev) => ({ ...prev, nutritionGlucides: event.target.value }))} />
                            </label>
                            <label className="admin-field">
                                <span>Lipides</span>
                                <input type="number" min="0" value={productForm.nutritionLipides} onChange={(event) => setProductForm((prev) => ({ ...prev, nutritionLipides: event.target.value }))} />
                            </label>
                            <label className="admin-field">
                                <span>Fibres</span>
                                <input type="number" min="0" value={productForm.nutritionFibres} onChange={(event) => setProductForm((prev) => ({ ...prev, nutritionFibres: event.target.value }))} />
                            </label>
                        </div>
                    </div>

                    {productForm.id && (
                        <label className="admin-checkbox">
                            <input type="checkbox" checked={productForm.is_active} onChange={(event) => setProductForm((prev) => ({ ...prev, is_active: event.target.checked }))} />
                            <span>Produit actif</span>
                        </label>
                    )}

                    <div className="admin-actions">
                        <button type="submit" className="btn btn--primary" disabled={savingProduct}>
                            {savingProduct ? "Sauvegarde..." : productForm.id ? "Mettre a jour" : "Creer le produit"}
                        </button>
                        <button type="button" className="btn btn--outline" onClick={closeForm} disabled={savingProduct}>
                            Annuler
                        </button>
                    </div>

                    {productForm.id && (
                        <AdminProductGallery productId={productForm.id} />
                    )}
                </form>
            )}

            <div className="admin-table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Image</th>
                                <SortableTh label="Produit" col="name" sort={productSort} onSort={setProductSort} />
                                <SortableTh label="Categorie" col="category_name" sort={productSort} onSort={setProductSort} />
                                <SortableTh label="Prix" col="price" sort={productSort} onSort={setProductSort} numeric />
                                <SortableTh label="Stock" col="stock" sort={productSort} onSort={setProductSort} numeric />
                                <SortableTh label="IG" col="glycemic_index" sort={productSort} onSort={setProductSort} numeric />
                                <SortableTh label="Statut" col="is_active" sort={productSort} onSort={setProductSort} />
                                <th className="admin-col-actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedProducts.map((product) => (
                                <tr key={product.id}>
                                    <td>
                                        {product.image ? (
                                            <img className="admin-product-thumb" src={resolveImageUrl(product.image)} alt={product.name} />
                                        ) : (
                                            <span className="admin-muted">Aucune</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="admin-product-cell">
                                            <strong>{product.name}</strong>
                                            <small>{truncate(product.description, 70)}</small>
                                        </div>
                                    </td>
                                    <td>{product.category_name}</td>
                                    <td>{formatPrice(product.price)}</td>
                                    <td><span className={Number(product.stock) <= 5 ? "admin-low-stock" : ""}>{product.stock}</span></td>
                                    <td>{product.glycemic_index ?? "-"}</td>
                                    <td>
                                        <span className={`admin-status ${product.is_active ? "admin-status--payee" : "admin-status--annulee"}`}>
                                            {product.is_active ? "Actif" : "Inactif"}
                                        </span>
                                    </td>
                                    <td className="admin-col-actions">
                                        <div className="admin-inline-actions">
                                            <button type="button" className="btn btn--outline" onClick={() => handleEdit(product)}>Modifier</button>
                                            <button
                                                type="button"
                                                className="btn btn--outline admin-danger"
                                                onClick={() => { void handleToggle(product) }}
                                                disabled={busyProductId === product.id}
                                            >
                                                {busyProductId === product.id ? "..." : product.is_active ? "Desactiver" : "Reactiver"}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn--outline admin-danger"
                                                onClick={() => { void handleDelete(product) }}
                                                disabled={busyProductId === product.id}
                                                title="Suppression definitive"
                                            >
                                                Supprimer
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {sortedProducts.length === 0 && (
                                <tr><td colSpan="8" className="admin-empty-cell">Aucun produit trouve.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
        </div>
    )
}
