// Composant generique pour les etats vides (catalogue filtre vide,
// commandes vides, tableau admin vide, etc.). Inclut icone + titre + hint
// + action optionnelle.
export const EmptyState = ({ icon: Icon, title, hint, action, size = "md" }) => {
    return (
        <div className={`empty-state empty-state--${size}`} role="status">
            {Icon ? (
                <div className="empty-state__icon" aria-hidden="true">
                    <Icon size={size === "sm" ? 32 : 48} strokeWidth={1.5} />
                </div>
            ) : null}
            {title ? <p className="empty-state__title">{title}</p> : null}
            {hint ? <p className="empty-state__hint">{hint}</p> : null}
            {action ? <div className="empty-state__action">{action}</div> : null}
        </div>
    )
}
