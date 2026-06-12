import "./style.scss"

export const Pagination = ({ page, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null

    const pages = []
    for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
    }

    return (
        <div className="pagination">
            <button
                className="pagination__btn"
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
            >
                &laquo; Precedent
            </button>

            {pages.map((p) => (
                <button
                    key={p}
                    className={`pagination__item ${p === page ? "pagination__item--active" : ""}`}
                    onClick={() => onPageChange(p)}
                >
                    {p}
                </button>
            ))}

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
