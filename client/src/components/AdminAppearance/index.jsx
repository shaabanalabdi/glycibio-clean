import { useRef, useState } from "react"
import { Image as ImageIcon, Upload, Trash2 } from "lucide-react"
import { useGetSettingsQuery } from "@slices/settingApiSlice.js"
import {
    useUpdateHeroBackgroundMutation,
    useResetHeroBackgroundMutation
} from "@slices/adminApiSlice.js"
import { resolveImageUrl } from "@utils/imageUrl.js"

// Onglet "Apparence" : image de fond du hero d'accueil (upload / reinitialisation).
// Lit le meme cache RTK que le front public (tag "settings") -> le hero se met
// a jour automatiquement apres enregistrement.
export const AdminAppearance = () => {
    const { data: settings } = useGetSettingsQuery()
    const [updateHero, { isLoading: uploading }] = useUpdateHeroBackgroundMutation()
    const [resetHero, { isLoading: resetting }] = useResetHeroBackgroundMutation()
    const [notice, setNotice] = useState({ type: "", text: "" })
    const fileRef = useRef(null)

    const current = settings?.hero_background

    const handleUpload = async (event) => {
        event.preventDefault()
        setNotice({ type: "", text: "" })
        const file = fileRef.current?.files?.[0]
        if (!file) {
            setNotice({ type: "error", text: "Choisissez une image." })
            return
        }
        const formData = new FormData()
        formData.append("image", file)
        try
        {
            await updateHero(formData).unwrap()
            setNotice({ type: "ok", text: "Image de fond mise à jour." })
            if (fileRef.current) fileRef.current.value = ""
        }
        catch (err)
        {
            setNotice({ type: "error", text: err?.data?.message || "Échec de l'envoi de l'image." })
        }
    }

    const handleReset = async () => {
        if (!window.confirm("Réinitialiser l'image de fond du hero (revenir au dégradé) ?")) return
        setNotice({ type: "", text: "" })
        try
        {
            await resetHero().unwrap()
            setNotice({ type: "ok", text: "Image de fond réinitialisée." })
        }
        catch (err)
        {
            setNotice({ type: "error", text: err?.data?.message || "Échec de la réinitialisation." })
        }
    }

    return (
        <div className="admin-panel">
            <div className="admin-head">
                <div className="admin-head__titles">
                    <h2><ImageIcon size={20} aria-hidden="true" /> Apparence</h2>
                    <p className="admin-head__subtitle">
                        Image de fond de la section d'accueil (hero). Format paysage large recommandé (≥ 1600px).
                    </p>
                </div>
            </div>

            {notice.text && (
                <p
                    role={notice.type === "error" ? "alert" : "status"}
                    style={{
                        margin: "0 0 1rem",
                        fontWeight: 600,
                        color: notice.type === "error" ? "var(--color-error-fg)" : "var(--color-success-fg)"
                    }}
                >
                    {notice.text}
                </p>
            )}

            <div
                style={{
                    marginBottom: "1rem",
                    borderRadius: "12px",
                    overflow: "hidden",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface-alt)"
                }}
            >
                {current ? (
                    <img
                        src={resolveImageUrl(current)}
                        alt="Aperçu de l'image de fond actuelle du hero"
                        style={{ display: "block", width: "100%", maxHeight: "240px", objectFit: "cover" }}
                    />
                ) : (
                    <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                        Aucune image — le hero utilise le dégradé par défaut.
                    </div>
                )}
            </div>

            <form className="admin-form-card" onSubmit={handleUpload}>
                <div className="admin-field">
                    <label htmlFor="hero-bg-file">Nouvelle image (JPEG, PNG ou WebP — 5 Mo max)</label>
                    <input
                        id="hero-bg-file"
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                    />
                </div>

                <div className="admin-actions">
                    <button type="submit" className="btn btn--primary" disabled={uploading}>
                        <Upload size={18} aria-hidden="true" /> {uploading ? "Envoi..." : "Mettre à jour"}
                    </button>
                    {current && (
                        <button type="button" className="btn btn--outline" onClick={handleReset} disabled={resetting}>
                            <Trash2 size={18} aria-hidden="true" /> Réinitialiser
                        </button>
                    )}
                </div>
            </form>
        </div>
    )
}
