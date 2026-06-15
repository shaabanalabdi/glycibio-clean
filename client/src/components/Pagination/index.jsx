import "./style.scss"

// Construit la liste des pages a afficher avec des points de suspension :
//   1 … 4 [5] 6 … 20   (fenetre autour de la page courante).
// Avant : on rendait UN bouton par page (1..N) -> bande inutilisable des que le
// catalogue grandit. Ici le DOM reste borne quel que soit le nombre de pages.
const buildPageList = (page, totalPages, siblings = 1) => {
    const pages = new Set([1, totalPages])
    for (let i = page - siblings; i <= page + siblings; i += 1) {
        if (i >= 1 && i <= totalPages) pages.add(i)
    }
    const sorted = [...pages].sort((a, b) => a - b)
    const out = []
    let prev = 0
    for (const p of sorted) {
        if (p - prev > 1) out.push("…")
        out.push(p)
        prev = p
    }
    return out
}

export const Pagination = ({ page, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null

    const items = buildPageList(page, totalPages)

    return (
        <div className="pagination">
            <button
                className="pagination__btn"
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
            >
                &laquo; Precedent
            </button>

            {items.map((p, idx) =>
                p === "…" ? (
                    <span key={`gap-${idx}`} className="pagination__ellipsis" aria-hidden="true">…</span>
                ) : (
                    <button
                        key={p}
                        className={`pagination__item ${p === page ? "pagination__item--active" : ""}`}
                        onClick={() => onPageChange(p)}
                        aria-label={`Page ${p}`}
                        aria-current={p === page ? "page" : undefined}
                    >
                        {p}
                    </button>
                )
            )}

            <button
                className="pagination__btn"
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages}
            >
                Suivant &raquo;
            </button>
        </div>
    )
}
