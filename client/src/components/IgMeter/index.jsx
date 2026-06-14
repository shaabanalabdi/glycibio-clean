import "./style.scss"

// Composant signature GlyciBio : rend l'index glycemique sur une piste
// gradient (vert -> orange -> rouge) avec un marqueur blanc borde de la
// couleur du niveau. Reutilise partout ou un IG apparait.
// API alignee sur le handoff design : ig, size, showBadge, showScale.

const LEVELS = {
    bas:   { label: "BAS" },
    moyen: { label: "MODÉRÉ" },
    eleve: { label: "ÉLEVÉ" }
}

const getLevel = (ig) => (ig <= 55 ? "bas" : ig <= 69 ? "moyen" : "eleve")

export const IgMeter = ({ ig, size = "md", showBadge = false, showScale = false }) => {
    const value = Math.max(0, Math.min(100, Math.round(Number(ig) || 0)))
    const level = getLevel(value)
    const { label } = LEVELS[level]
    const pos = Math.min(Math.max(value, 2), 98)   // marqueur clamp 2%..98%

    return (
        <div
            className={`ig-meter ig-meter--${size} ig-meter--${level}`}
            role="img"
            aria-label={`Index glycemique ${value} sur 100, niveau ${label.toLowerCase()}`}
        >
            <div className="ig-meter__track">
                <span className="ig-meter__marker" style={{ left: `${pos}%` }} />
            </div>

            {showBadge && <span className="ig-meter__badge">IG {value}</span>}

            {showScale && (
                <div className="ig-meter__scale" aria-hidden="true">
                    <span className="ig-meter__scale-item ig-meter__scale-item--bas">Bas · 0–55</span>
                    <span className="ig-meter__scale-item ig-meter__scale-item--moyen">Modéré · 56–69</span>
                    <span className="ig-meter__scale-item ig-meter__scale-item--eleve">Élevé · 70+</span>
                </div>
            )}
        </div>
    )
}
