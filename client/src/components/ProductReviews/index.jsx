import { useState } from "react"
import { Star } from "lucide-react"
import { useAuthenticated } from "@hooks/useAuthenticated.js"
import { useGetProductReviewsQuery, useCreateReviewMutation } from "@slices/productApiSlice.js"

const Stars = ({ value, size = 16, interactive = false, onChange }) => {
    return (
        <span className={`stars ${interactive ? "stars--interactive" : ""}`} role={interactive ? "radiogroup" : "img"} aria-label={`Note ${value} sur 5`}>
            {[1, 2, 3, 4, 5].map((n) => {
                const filled = value >= n
                return interactive ? (
                    <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={value === n}
                        className={`stars__btn ${filled ? "stars__btn--filled" : ""}`}
                        onClick={() => onChange(n)}
                        aria-label={`${n} etoile${n > 1 ? "s" : ""}`}
                    >
                        <Star size={size} fill={filled ? "currentColor" : "none"} aria-hidden="true" />
                    </button>
                ) : (
                    <Star
                        key={n}
                        size={size}
                        className={filled ? "stars__star--filled" : "stars__star--empty"}
                        fill={filled ? "currentColor" : "none"}
                        aria-hidden="true"
                    />
                )
            })}
        </span>
    )
}

export const ProductReviews = ({ productId }) => {
    const { authUser } = useAuthenticated()
    const [form, setForm] = useState({ rating: 5, title: "", comment: "" })
    const [formMsg, setFormMsg] = useState({ text: "", ok: true })
    const [showForm, setShowForm] = useState(false)

    const { data, isLoading } = useGetProductReviewsQuery(productId)
    const [createReview] = useCreateReviewMutation()

    const reviews = data?.reviews ?? []
    const count = data?.count ?? 0
    const average = data?.average ?? 0

    const submit = async (e) => {
        e.preventDefault()
        setFormMsg({ text: "", ok: true })

        try
        {
            const res = await createReview({ productId, ...form }).unwrap()
            setFormMsg({ text: res.message, ok: true })
            setForm({ rating: 5, title: "", comment: "" })
            setShowForm(false)
        }
        catch (error)
        {
            setFormMsg({ text: error?.data?.message || "Une erreur est survenue", ok: false })
        }
    }

    return (
        <section className="reviews">
            <div className="reviews__header">
                <h2>Avis clients</h2>
                {count > 0 ? (
                    <div className="reviews__summary">
                        <Stars value={Math.round(average)} size={20} />
                        <strong>{average.toFixed(1)} / 5</strong>
                        <span className="reviews__count">({count} avis)</span>
                    </div>
                ) : (
                    <p className="reviews__empty-summary">Aucun avis pour le moment.</p>
                )}
            </div>

            {authUser && !showForm && (
                <button className="btn btn--outline" onClick={() => setShowForm(true)}>
                    Laisser un avis
                </button>
            )}

            {!authUser && (
                <p className="reviews__login-hint">
                    <a href="/login">Connectez-vous</a> pour laisser un avis sur ce produit.
                </p>
            )}

            {showForm && (
                <form className="reviews__form" onSubmit={submit}>
                    {formMsg.text && (
                        <p className={`reviews__msg ${formMsg.ok ? "" : "reviews__msg--error"}`}>{formMsg.text}</p>
                    )}

                    <div className="reviews__field">
                        <label>Votre note</label>
                        <Stars
                            value={form.rating}
                            size={28}
                            interactive
                            onChange={(n) => setForm({ ...form, rating: n })}
                        />
                    </div>

                    <div className="reviews__field">
                        <label htmlFor="review-title">Titre (optionnel)</label>
                        <input
                            id="review-title"
                            type="text"
                            maxLength={120}
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            placeholder="Ex: Tres bon produit"
                        />
                    </div>

                    <div className="reviews__field">
                        <label htmlFor="review-comment">Votre avis *</label>
                        <textarea
                            id="review-comment"
                            rows={5}
                            minLength={10}
                            maxLength={2000}
                            required
                            value={form.comment}
                            onChange={(e) => setForm({ ...form, comment: e.target.value })}
                            placeholder="Decrivez votre experience (gout, qualite, livraison...)"
                        />
                        <small>{form.comment.length} / 2000 caracteres</small>
                    </div>

                    <div className="reviews__form-actions">
                        <button type="submit" className="btn btn--primary">Publier mon avis</button>
                        <button type="button" className="btn btn--outline" onClick={() => setShowForm(false)}>
                            Annuler
                        </button>
                    </div>

                    <p className="reviews__form-info">
                        Votre avis sera publie apres moderation. Vous devez avoir achete ce produit pour laisser un avis.
                    </p>
                </form>
            )}

            {isLoading ? (
                <p>Chargement des avis...</p>
            ) : reviews.length > 0 ? (
                <ul className="reviews__list">
                    {reviews.map((r) => (
                        <li key={r.id} className="reviews__item">
                            <div className="reviews__item-head">
                                <Stars value={r.rating} size={14} />
                                <strong>{r.title || "Avis verifie"}</strong>
                            </div>
                            <p className="reviews__item-meta">
                                {r.author_first_name || "Client"} - {new Date(r.created_at).toLocaleDateString("fr-FR")}
                            </p>
                            <p className="reviews__item-body">{r.comment}</p>
                        </li>
                    ))}
                </ul>
            ) : null}
        </section>
    )
}
