import { ArrowDown, ArrowUp, ArrowDownUp } from "lucide-react"

// En-tete de colonne triable, conforme WCAG (aria-sort + button)
// Usage :
//   <SortableTh label="Prix" col="price" sort={sort} onSort={setSort} numeric />
//
// `sort` est un objet { col, dir } controle par le parent.
// `dir` : 'asc' | 'desc' | null.
export const SortableTh = ({ label, col, sort, onSort, numeric = false }) => {
    const isActive = sort.col === col
    const dir = isActive ? sort.dir : null
    const ariaSort = dir === "asc" ? "ascending" : dir === "desc" ? "descending" : "none"

    const handleClick = () => {
        if (!isActive) onSort({ col, dir: "asc" })
        else if (dir === "asc") onSort({ col, dir: "desc" })
        else onSort({ col: null, dir: null })
    }

    const Icon = dir === "asc" ? ArrowUp : dir === "desc" ? ArrowDown : ArrowDownUp

    return (
        <th aria-sort={ariaSort} className={`sortable-th ${numeric ? "sortable-th--numeric" : ""}`}>
            <button
                type="button"
                className="sortable-th__btn"
                onClick={handleClick}
                aria-label={`Trier par ${label}${dir === "asc" ? " (ordre croissant)" : dir === "desc" ? " (ordre decroissant)" : ""}`}
            >
                <span>{label}</span>
                <Icon size={14} strokeWidth={2} aria-hidden="true" className={`sortable-th__icon ${isActive ? "sortable-th__icon--active" : ""}`} />
            </button>
        </th>
    )
}
