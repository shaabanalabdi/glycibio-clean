import "./style.scss"
import { igLevelOf, IG_LEVEL_LABELS, IG_LEVEL_RANGES } from "@utils/ig.js"

// Composant signature GlyciBio : rend l'index glycemique sur une piste
// gradient (vert -> orange -> rouge) avec un marqueur blanc borde de la
// couleur du niveau. Reutilise partout ou un IG apparait.
// Seuils et libelles proviennent de @utils/ig.js (source unique de verite).
// API alignee sur le handoff design : ig, size, showBadge, showScale.

export const IgMeter = ({ ig, size = "md", showBadge = false, showScale = false }) => {
    const value = Math.max(0, Math.min(100, Math.round(Number(ig) || 0)))
    const level = igLevelOf(value)
    const label = IG_LEVEL_LABELS[level]
    const pos = Math.min(Math.max(value, 2), 98)   // marqueur clamp 2%..98%

    // Quand l'echelle est affichee, on inclut les bornes dans le libelle lu par
    // les lecteurs d'ecran (sinon "niveau bas" sans le contexte des seuils).
    const ariaLabel = showScale
        ? `Index glycemique ${value} sur 100, niveau ${label.toLowerCase()} (bas ${IG_LEVEL_RANGES.bas}, modere ${IG_LEVEL_RANGES.moyen}, eleve ${IG_LEVEL_RANGES.eleve})`
        : `Index glycemique ${value} sur 100, niveau ${label.toLowerCase()}`

    return (
        <div
            className={`ig-meter ig-meter--${size} ig-meter--${level}`}
            role="img"
            aria-label={ariaLabel}
        >
            <div className="ig-meter__track">
                <span className="ig-meter__marker" style={{ left: `${pos}%` }} />
            </div>

            {showBadge && <span className="ig-meter__badge">IG {value}</span>}

            {showScale && (
                <div className="ig-meter__scale" aria-hidden="true">
                    <span className="ig-meter__scale-item ig-meter__scale-item--bas">{IG_LEVEL_LABELS.bas} · {IG_LEVEL_RANGES.bas}</span>
                    <span className="ig-meter__scale-item ig-meter__scale-item--moyen">{IG_LEVEL_LABELS.moyen} · {IG_LEVEL_RANGES.moyen}</span>
                    <span className="ig-meter__scale-item ig-meter__scale-item--eleve">{IG_LEVEL_LABELS.eleve} · {IG_LEVEL_RANGES.eleve}</span>
                </div>
            )}
        </div>
    )
}
