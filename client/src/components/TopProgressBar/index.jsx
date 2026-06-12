import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"

// Barre de progression haute (style Apple / YouTube). Sous un BrowserRouter
// classique (pas de data router), on declenche une breve animation a chaque
// changement de route : 0 -> 90% pendant le lazy-load de la page, puis 100%
// + fade out une fois la nouvelle route montee.
//
// 3 etats :
//   - idle    : opacity 0, scale-x 0
//   - loading : monte progressivement de 20 a 90% (asymptote)
//   - done    : passe a 100% puis fade out
export const TopProgressBar = () => {
    const location = useLocation()
    const [state, setState] = useState("idle")     // 'idle' | 'loading' | 'done'
    const [progress, setProgress] = useState(0)

    // A chaque changement de pathname : breve sequence loading -> done -> idle.
    /* eslint-disable react-hooks/set-state-in-effect -- pilote par la navigation (sync external -> internal) */
    useEffect(() => {
        setState("loading")
        setProgress(20)

        const grow = setInterval(() => {
            setProgress((p) => (p < 90 ? p + (90 - p) * 0.2 : p))
        }, 200)

        const finish = setTimeout(() => {
            clearInterval(grow)
            setProgress(100)
            setState("done")
        }, 350)

        const reset = setTimeout(() => {
            setState("idle")
            setProgress(0)
        }, 700)

        return () => {
            clearInterval(grow)
            clearTimeout(finish)
            clearTimeout(reset)
        }
    }, [location.pathname])
    /* eslint-enable react-hooks/set-state-in-effect */

    if (state === "idle") return null

    return (
        <div className="top-progress" role="progressbar" aria-label="Chargement" aria-hidden="true">
            <div
                className="top-progress__bar"
                style={{
                    transform: `scaleX(${progress / 100})`,
                    opacity: state === "done" ? 0 : 1
                }}
            />
        </div>
    )
}
