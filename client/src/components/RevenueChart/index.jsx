import { useId, useMemo, useState } from "react"
import { formatPrice } from "@utils/formatPrice.js"

// Graphique en barres SVG (zero dependance).
// - Tooltip au hover/focus
// - Tableau alternatif (caché visuellement) pour screen readers : a11y
// - Respecte prefers-reduced-motion (la transition d'apparition est instantanee)
// - Couleurs : utilise des variables CSS du theme (theme-aware)
//
// data : [{ date: 'YYYY-MM-DD', revenue: number }, ...] (30 elements)
export const RevenueChart = ({ data }) => {
    const tableId = useId()
    const [hover, setHover] = useState(null)

    const { max, total, days } = useMemo(() => {
        const values = data.map((d) => Number(d.revenue) || 0)
        const m = Math.max(...values, 1)   // au moins 1 pour eviter division par 0
        const t = values.reduce((sum, v) => sum + v, 0)
        return { max: m, total: t, days: data.length }
    }, [data])

    if (!data || data.length === 0) {
        return null
    }

    const formatDayLabel = (iso) => {
        const d = new Date(iso)
        return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
    }

    // Affiche seulement quelques etiquettes d'axe X pour eviter l'encombrement
    const xLabelStep = Math.max(1, Math.floor(days / 6))

    return (
        <div className="revenue-chart" role="figure" aria-labelledby={`${tableId}-caption`}>
            <div className="revenue-chart__header">
                <h3 id={`${tableId}-caption`}>Chiffre d&apos;affaires - 30 derniers jours</h3>
                <p className="revenue-chart__total" aria-label={`Total sur 30 jours : ${formatPrice(total)}`}>
                    <strong>{formatPrice(total)}</strong>
                    <span>sur {days} jours</span>
                </p>
            </div>

            {/* Graphique en barres (visuel) */}
            <div className="revenue-chart__plot">
                <div className="revenue-chart__bars" aria-hidden="true">
                    {data.map((d, idx) => {
                        const value = Number(d.revenue) || 0
                        const height = max > 0 ? (value / max) * 100 : 0
                        const isHover = hover === idx
                        return (
                            <button
                                type="button"
                                key={d.date}
                                className={`revenue-chart__bar ${value === 0 ? "revenue-chart__bar--empty" : ""} ${isHover ? "revenue-chart__bar--hover" : ""}`}
                                style={{ height: `${Math.max(height, 0.5)}%` }}
                                onMouseEnter={() => setHover(idx)}
                                onMouseLeave={() => setHover(null)}
                                onFocus={() => setHover(idx)}
                                onBlur={() => setHover(null)}
                                aria-label={`${formatDayLabel(d.date)} : ${formatPrice(value)}`}
                            >
                                {isHover && (
                                    <span className="revenue-chart__tooltip" role="tooltip">
                                        <strong>{formatPrice(value)}</strong>
                                        <span>{formatDayLabel(d.date)}</span>
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Etiquettes axe X — quelques jours seulement */}
                <div className="revenue-chart__axis" aria-hidden="true">
                    {data.map((d, idx) => (
                        <span key={d.date} className="revenue-chart__axis-tick">
                            {idx % xLabelStep === 0 ? formatDayLabel(d.date) : ""}
                        </span>
                    ))}
                </div>
            </div>

            {/* Tableau alternatif pour screen readers (WCAG : ne pas se reposer sur la couleur) */}
            <table id={tableId} className="sr-only">
                <caption>Detail jour par jour du chiffre d&apos;affaires des 30 derniers jours</caption>
                <thead>
                    <tr><th scope="col">Date</th><th scope="col">Revenu</th></tr>
                </thead>
                <tbody>
                    {data.map((d) => (
                        <tr key={d.date}>
                            <td>{formatDayLabel(d.date)}</td>
                            <td>{formatPrice(d.revenue)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
