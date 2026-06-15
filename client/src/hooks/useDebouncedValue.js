import { useState, useEffect } from "react"

// Renvoie une copie "retardee" de `value` : elle ne se met a jour qu'apres
// `delay` ms SANS nouvelle modification. Permet d'eviter de declencher une
// requete API a chaque frappe (recherche / filtres prix du catalogue).
export const useDebouncedValue = (value, delay = 350) => {
    const [debounced, setDebounced] = useState(value)

    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay)
        return () => clearTimeout(id)
    }, [value, delay])

    return debounced
}
