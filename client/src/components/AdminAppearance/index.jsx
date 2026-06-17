import { useEffect, useRef, useState } from "react"
import { Image as ImageIcon, Upload, Trash2, Type, Save } from "lucide-react"
import { useGetSettingsQuery } from "@slices/settingApiSlice.js"
import {
    useUpdateHeroBackgroundMutation,
    useResetHeroBackgroundMutation,
    useUpdateHeroContentMutation
} from "@slices/adminApiSlice.js"
import { resolveImageUrl } from "@utils/imageUrl.js"

// Champs texte editables du hero (cle settings + libelle + type + exemple).
// Doit rester aligne avec HERO_TEXT_KEYS (back) et le repli de la page Home.
const HERO_FIELDS = [
    { key: "hero_eyebrow",              label: "Surtitre (eyebrow)",                  type: "text",     ph: "Selection 2026 · Index glycemique controle" },
    { key: "hero_title",                label: "Titre — ligne 1",                     type: "text",     ph: "Mangez sain," },
    { key: "hero_title_highlight",      label: "Titre — ligne 2 (mise en avant)",     type: "text",     ph: "maitrisez votre glycemie" },
    { key: "hero_text",                 label: "Accroche / paragraphe",               type: "textarea", ph: "Une selection d'aliments bio a index glycemique verifie..." },
    { key: "hero_cta_primary_label",    label: "Bouton principal — texte",            type: "text",     ph: "Voir le catalogue" },
    { key: "hero_cta_primary_link",     label: "Bouton principal — lien",             type: "text",     ph: "/catalogue" },
    { key: "hero_cta_secondary_label",  label: "Bouton secondaire — texte (visiteurs)", type: "text",   ph: "Creer un compte" },
    { key: "hero_cta_secondary_link",   label: "Bouton secondaire — lien",            type: "text",     ph: "/register" },
    { key: "hero_trust_1",              label: "Garantie 1",                          type: "text",     ph: "IG verifie" },
    { key: "hero_trust_2",              label: "Garantie 2",                          type: "text",     ph: "Livraison 48h" },
    { key: "hero_trust_3",              label: "Garantie 3",                          type: "text",     ph: "Selection bio" }
]

// Onglet "Apparence" : personnalisation de la section d'accueil (hero) —
// image de fond + tous les contenus texte (titre, accroche, boutons, garanties).
// Lit le meme cache RTK que le front public (tag "settings") -> le hero se met
// a jour automatiquement apres enregistrement.
export const AdminAppearance = () => {
    const { data: settings } = useGetSettingsQuery()
    const [updateHero, { isLoading: uploading }] = useUpdateHeroBackgroundMutation()
    const [resetHero, { isLoading: resetting }] = useResetHeroBackgroundMutation()
    const [saveContent, { isLoading: savingContent }] = useUpdateHeroContentMutation()
    const [notice, setNotice] = useState({ type: "", text: "" })
    const [form, setForm] = useState({})
    const fileRef = useRef(null)

    const current = settings?.hero_background

    // Pre-remplit le formulaire des que les settings sont charges.
    useEffect(() => {
        if (!settings) return
        const next = {}
        for (const f of HERO_FIELDS) next[f.key] = settings[f.key] ?? ""
        setForm(next)
    }, [settings])

    const onField = (key) => (event) => {
        const { value } = event.target
        setForm((prev) => ({ ...prev, [key]: value }))
    }

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

    const handleSaveContent = async (event) => {
        event.preventDefault()
        setNotice({ type: "", text: "" })
        try
        {
            await saveContent(form).unwrap()
            setNotice({ type: "ok", text: "Contenu du hero mis à jour." })
        }
        catch (err)
        {
            setNotice({ type: "error", text: err?.data?.message || "Échec de l'enregistrement du contenu." })
        }
    }

    return (
        <div className="admin-panel">
            <div className="admin-head">
                <div className="admin-head__titles">
                    <h2><ImageIcon size={20} aria-hidden="true" /> Apparence</h2>
                    <p className="admin-head__subtitle">
                        Personnalisez la section d'accueil (hero) : image de fond et tous les contenus
                        (titre, accroche, boutons, garanties). Les champs laissés vides reprennent la valeur par défaut.
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

            {/* --- Image de fond --- */}
            <h3 style={{ margin: "0 0 0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <ImageIcon size={18} aria-hidden="true" /> Image de fond
            </h3>
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
                    <label htmlFor="hero-bg-file">Nouvelle image (JPEG, PNG ou WebP — 5 Mo max, ≥ 1600px de large)</label>
                    <input
                        id="hero-bg-file"
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                    />
                </div>

                <div className="admin-actions">
                    <button type="submit" className="btn btn--primary" disabled={uploading}>
                        <Upload size={18} aria-hidden="true" /> {uploading ? "Envoi..." : "Mettre à jour l'image"}
                    </button>
                    {current && (
                        <button type="button" className="btn btn--outline" onClick={handleReset} disabled={resetting}>
                            <Trash2 size={18} aria-hidden="true" /> Réinitialiser
                        </button>
                    )}
                </div>
            </form>

            {/* --- Contenu texte du hero --- */}
            <h3 style={{ margin: "1.75rem 0 0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Type size={18} aria-hidden="true" /> Contenu du hero
            </h3>
            <form className="admin-form-card" onSubmit={handleSaveContent}>
                {HERO_FIELDS.map((f) => (
                    <div className="admin-field" key={f.key}>
                        <label htmlFor={`hero-${f.key}`}>{f.label}</label>
                        {f.type === "textarea" ? (
                            <textarea
                                id={`hero-${f.key}`}
                                rows={3}
                                value={form[f.key] ?? ""}
                                onChange={onField(f.key)}
                                placeholder={f.ph}
                            />
                        ) : (
                            <input
                                id={`hero-${f.key}`}
                                type="text"
                                value={form[f.key] ?? ""}
                                onChange={onField(f.key)}
                                placeholder={f.ph}
                            />
                        )}
                    </div>
                ))}

                <div className="admin-actions">
                    <button type="submit" className="btn btn--primary" disabled={savingContent}>
                        <Save size={18} aria-hidden="true" /> {savingContent ? "Enregistrement..." : "Enregistrer le contenu"}
                    </button>
                </div>
            </form>
        </div>
    )
}
