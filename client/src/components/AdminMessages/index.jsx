import { useMemo, useState } from "react"
import {
    useGetAdminContactsQuery,
    useMarkContactReadMutation
} from "@slices/adminApiSlice.js"
import { Skeleton } from "@components/Skeleton/index.jsx"

const formatDate = (value) => (value ? new Date(value).toLocaleString("fr-FR") : "-")
const truncate = (text, max = 90) => (!text ? "" : text.length <= max ? text : `${text.slice(0, max)}...`)

// Onglet "Messages clients" : filtres pills + tableau + action "Marquer lu"
// Donnees via RTK Query (adminApiSlice) : l'invalidation du tag "adminContacts"
// rafraichit automatiquement la liste apres "Marquer lu".
export const AdminMessages = () => {
    const { data: messages = [], isLoading, isError, refetch } = useGetAdminContactsQuery()
    const [markContactRead] = useMarkContactReadMutation()

    const [messageFilter, setMessageFilter] = useState("all")
    const [busyMessageId, setBusyMessageId] = useState(null)
    const [notice, setNotice] = useState({ type: "", text: "" })

    const filteredMessages = useMemo(() => {
        if (messageFilter === "unread") return messages.filter((message) => !message.is_read)
        if (messageFilter === "read") return messages.filter((message) => !!message.is_read)
        return messages
    }, [messages, messageFilter])

    const handleMarkAsRead = async (messageId) => {
        setBusyMessageId(messageId)
        try
        {
            await markContactRead(messageId).unwrap()
            setNotice({ type: "success", text: "Message marque comme lu." })
        }
        catch (error)
        {
            setNotice({ type: "error", text: error?.data?.message || "Impossible de marquer le message." })
        }
        setBusyMessageId(null)
    }

    if (isLoading) {
        return (
            <div className="admin-panel" aria-busy="true">
                <Skeleton width="260px" height="1.75rem" />
                <Skeleton width="100%" height="220px" style={{ marginTop: "1rem" }} />
            </div>
        )
    }

    if (isError) {
        return (
            <div className="admin-panel">
                <p className="admin-panel__empty">Impossible de charger les messages.</p>
                <button type="button" className="btn btn--outline" onClick={() => refetch()}>
                    Reessayer
                </button>
            </div>
        )
    }

    return (
        <div className="admin-panel">
            {notice.text && (
                <p className={`admin-console__notice admin-console__notice--${notice.type || "info"}`} role={notice.type === "error" ? "alert" : "status"} aria-live={notice.type === "error" ? "assertive" : "polite"}>
                    {notice.text}
                </p>
            )}
            <header className="admin-head">
                <div className="admin-head__titles">
                    <h2>Messages clients <span className="admin-count-badge">{messages.length}</span></h2>
                    <p className="admin-head__subtitle">Demandes recues via le formulaire de contact.</p>
                </div>
                <div className="admin-head__controls">
                    <div className="admin-filter-group">
                        <button type="button" className={messageFilter === "all" ? "admin-pill admin-pill--active" : "admin-pill"} onClick={() => setMessageFilter("all")}>Tous</button>
                        <button type="button" className={messageFilter === "unread" ? "admin-pill admin-pill--active" : "admin-pill"} onClick={() => setMessageFilter("unread")}>Non lus</button>
                        <button type="button" className={messageFilter === "read" ? "admin-pill admin-pill--active" : "admin-pill"} onClick={() => setMessageFilter("read")}>Lus</button>
                    </div>
                </div>
            </header>
            {filteredMessages.length === 0 ? <p className="admin-panel__empty">Aucun message pour ce filtre.</p> : (
                <div className="admin-table-wrap">
                    <table>
                        <thead><tr><th>Statut</th><th>Expediteur</th><th>Sujet</th><th>Message</th><th>Date</th><th>Action</th></tr></thead>
                        <tbody>
                            {filteredMessages.map((message) => (
                                <tr key={message.id} className={!message.is_read ? "admin-row--highlight" : ""}>
                                    <td><span className={`admin-status ${message.is_read ? "admin-status--livree" : "admin-status--en_attente"}`}>{message.is_read ? "Lu" : "Non lu"}</span></td>
                                    <td><div className="admin-user-inline"><strong>{message.name}</strong><small>{message.email}</small></div></td>
                                    <td>{message.subject}</td>
                                    <td>{truncate(message.message, 110)}</td>
                                    <td>{formatDate(message.created_at)}</td>
                                    <td>{!message.is_read ? <button type="button" className="btn btn--primary" onClick={() => { void handleMarkAsRead(message.id) }} disabled={busyMessageId === message.id}>{busyMessageId === message.id ? "..." : "Marquer lu"}</button> : <span className="admin-muted">Deja lu</span>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
