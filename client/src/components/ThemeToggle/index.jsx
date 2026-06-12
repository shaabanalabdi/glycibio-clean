import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"

const STORAGE_KEY = "glycibio-theme"

// Lit l'etat initial du theme (cote client uniquement)
const readInitialTheme = () => {
    if (typeof window === "undefined") return "system"
    try
    {
        const stored = window.localStorage.getItem(STORAGE_KEY)
        if (stored === "dark" || stored === "light") return stored
    }
    catch { /* ignore */ }
    return "system"
}

// Determine si l'effet courant est sombre (etat visuel du toggle)
const isCurrentlyDark = () => {
    if (typeof window === "undefined") return false
    const attr = document.documentElement.getAttribute("data-theme")
    if (attr === "dark") return true
    if (attr === "light") return false
    return window.matchMedia("(prefers-color-scheme: dark)").matches
}

export const ThemeToggle = () => {
    const [theme, setTheme] = useState(readInitialTheme)
    const [dark, setDark] = useState(isCurrentlyDark)

    // Applique le theme (DOM + localStorage) puis re-derive `dark` depuis
    // l'attribut. Pattern "sync external (DOM/localStorage) -> internal state".
    useEffect(() => {
        if (typeof document === "undefined") return
        if (theme === "system") {
            document.documentElement.removeAttribute("data-theme")
            try { window.localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
        } else {
            document.documentElement.setAttribute("data-theme", theme)
            try { window.localStorage.setItem(STORAGE_KEY, theme) } catch { /* ignore */ }
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect -- re-derive depuis le DOM (sync external -> internal)
        setDark(isCurrentlyDark())
    }, [theme])

    // Si l'utilisateur est en mode "system", reagir aux changements systeme
    useEffect(() => {
        if (theme !== "system" || typeof window === "undefined") return
        const mql = window.matchMedia("(prefers-color-scheme: dark)")
        const onChange = () => setDark(mql.matches)
        mql.addEventListener("change", onChange)
        return () => mql.removeEventListener("change", onChange)
    }, [theme])

    const toggle = () => setTheme(dark ? "light" : "dark")

    return (
        <button
            type="button"
            className="navbar__icon-btn theme-toggle"
            onClick={toggle}
            aria-label={dark ? "Passer en mode clair" : "Passer en mode sombre"}
            title={dark ? "Mode clair" : "Mode sombre"}
        >
            {dark ? <Sun size={22} strokeWidth={2} aria-hidden="true" /> : <Moon size={22} strokeWidth={2} aria-hidden="true" />}
        </button>
    )
}
