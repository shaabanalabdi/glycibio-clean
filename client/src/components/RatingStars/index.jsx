import "./style.scss"
import { Star, StarHalf } from "lucide-react"

// Affichage en lecture seule de la note moyenne (0–5) avec demi-étoile.
// Donnees fournies par la vue v_product_ratings (avg_rating, reviews_count).
export const RatingStars = ({ rating = 0, count = null, size = 15, showCount = true }) => {
    const value = Math.max(0, Math.min(5, Number(rating) || 0))
    const full = Math.floor(value)
    const half = value - full >= 0.5

    const stars = Array.from({ length: 5 }, (_, i) => {
        if (i < full) {
            return <Star key={i} size={size} className="rating-stars__star rating-stars__star--on" fill="currentColor" strokeWidth={0} aria-hidden="true" />
        }
        if (i === full && half) {
            return <StarHalf key={i} size={size} className="rating-stars__star rating-stars__star--on" fill="currentColor" strokeWidth={0} aria-hidden="true" />
        }
        return <Star key={i} size={size} className="rating-stars__star" strokeWidth={2} aria-hidden="true" />
    })

    const label = count != null
        ? `Note ${value} sur 5, ${count} avis`
        : `Note ${value} sur 5`

    return (
        <span className="rating-stars" role="img" aria-label={label}>
            <span className="rating-stars__row" aria-hidden="true">{stars}</span>
            {showCount && count != null && (
                <span className="rating-stars__count">({count})</span>
            )}
        </span>
    )
}
