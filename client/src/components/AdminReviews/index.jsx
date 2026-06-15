import { useState } from "react"
import {
    useGetAdminReviewsQuery,
    useUpdateReviewStatusMutation
} from "@slices/adminApiSlice.js"
import { Skeleton } from "@components/Skeleton/index.jsx"

// Onglet "Moderation des avis" : liste verticale + boutons Approuver / Rejeter.
// Donnees et actions via RTK Query (adminApiSlice) : l'invalidation du tag
// "adminReviews" retire automatiquement l'avis traite de la liste "pending".
export const AdminReviews = () => {
    const { data: pendingReviews = [], isLoading, isError, refetch } = useGetAdminReviewsQuery("pending")
    const [updateReviewStatus] = useUpdateReviewStatusMutation()

    const [notice, setNotice] = useState({ type: "", text: "" })

    const handleDecision = async (reviewId, status) => {
        try
        {
            await updateReviewStatus({ id: reviewId, status }).unwrap()
            setNotice({
                type: "success",
                text: status === "approved" ? "Avis approuve" : "Avis rejete"
            })
        }
        catch (error)
        {
            setNotice({ type: "error", text: error?.data?.message || "Action impossible." })
        }
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
                <p className="admin-panel__empty">Impossible de charger les avis.</p>
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
                    <h2>Moderation des avis <span className="admin-count-badge">{pendingReviews.length}</span></h2>
                    <p className="admin-head__subtitle">Avis clients en attente de validation.</p>
                </div>
            </header>
            {pendingReviews.length === 0 ? (
                <p className="admin-panel__empty">Aucun avis en attente de moderation.</p>
            ) : (
                <ul className="admin-reviews-list">
                    {pendingReviews.map((r) => (
                        <li key={r.id} className="admin-review">
                            <div className="admin-review__head">
                                <strong>{r.product_name}</strong>
                                <span>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                                <span className="admin-review__meta">
                                    par {r.first_name || r.user_email} - {new Date(r.created_at).toLocaleDateString("fr-FR")}
                                </span>
                            </div>
                            {r.title && <p className="admin-review__title">{r.title}</p>}
                            <p className="admin-review__body">{r.comment}</p>
                            <div className="admin-review__actions">
                                <button
                                    type="button"
                                    className="btn btn--primary btn--sm"
                                    onClick={() => { void handleDecision(r.id, "approved") }}
                                >Approuver</button>
                                <button
                                    type="button"
                                    className="btn btn--danger btn--sm"
                                    onClick={() => { void handleDecision(r.id, "rejected") }}
                                >Rejeter</button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
