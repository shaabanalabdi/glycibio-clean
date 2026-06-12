import { useState } from "react"
import { Trash2, Plus } from "lucide-react"
import {
    useGetGalleryQuery,
    useAddGalleryImageMutation,
    useDeleteGalleryImageMutation
} from "@slices/adminApiSlice.js"
import { resolveImageUrl } from "@utils/imageUrl"

export const AdminProductGallery = ({ productId, onChange }) => {
    const { data: images = [], isLoading: loading } = useGetGalleryQuery(productId, { skip: !productId })
    const [addGalleryImage, { isLoading: uploading }] = useAddGalleryImageMutation()
    const [deleteGalleryImage] = useDeleteGalleryImageMutation()

    const [error, setError] = useState("")
    const [altDraft, setAltDraft] = useState("")

    const handleUpload = async (event) => {
        setError("")
        const file = event.target.files?.[0]
        if (!file) return

        if (!/^image\/(jpe?g|png|webp)$/i.test(file.type)) {
            setError("Type non autorise (JPEG, PNG, WebP).")
            event.target.value = ""
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            setError("Fichier trop volumineux (max 5 Mo).")
            event.target.value = ""
            return
        }

        const fd = new FormData()
        fd.append("image", file)
        if (altDraft.trim()) fd.append("alt", altDraft.trim())

        try
        {
            await addGalleryImage({ productId, formData: fd }).unwrap()
            setAltDraft("")
            onChange?.()
        }
        catch (err)
        {
            setError(err?.data?.message || "Echec du televersement.")
        }
        event.target.value = ""
    }

    const handleDelete = async (imageId) => {
        if (!window.confirm("Supprimer definitivement cette image ?")) return
        try
        {
            await deleteGalleryImage({ productId, imageId }).unwrap()
            onChange?.()
        }
        catch
        {
            // l'erreur reste silencieuse comme avant (liste inchangee)
        }
    }

    return (
        <div className="admin-gallery">
            <div className="admin-gallery__header">
                <h4>Galerie ({images.length})</h4>
                <p className="admin-gallery__hint">
                    L&apos;image principale du produit est definie dans le formulaire ci-dessus. Ajoutez ici les
                    images supplementaires (vues alternatives, packshots, etc.).
                </p>
            </div>

            {error && <p className="admin-gallery__error">{error}</p>}

            <div className="admin-gallery__upload">
                <input
                    type="text"
                    placeholder="Texte alternatif (alt) - optionnel"
                    value={altDraft}
                    onChange={(e) => setAltDraft(e.target.value)}
                    maxLength={255}
                />
                <label className="btn btn--outline btn--sm admin-gallery__upload-label">
                    <Plus size={16} />
                    {uploading ? "Envoi..." : "Ajouter une image"}
                    <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleUpload}
                        disabled={uploading}
                        hidden
                    />
                </label>
            </div>

            {loading ? (
                <p>Chargement...</p>
            ) : images.length === 0 ? (
                <p className="admin-gallery__empty">Aucune image supplementaire.</p>
            ) : (
                <ul className="admin-gallery__grid">
                    {images.map((img) => (
                        <li key={img.id} className="admin-gallery__item">
                            <img src={resolveImageUrl(img.url)} alt={img.alt || "Image galerie"} />
                            <button
                                type="button"
                                className="admin-gallery__delete"
                                onClick={() => handleDelete(img.id)}
                                aria-label="Supprimer"
                                title="Supprimer"
                            >
                                <Trash2 size={16} />
                            </button>
                            {img.alt && <p className="admin-gallery__alt">{img.alt}</p>}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
