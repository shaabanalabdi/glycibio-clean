import { useMemo, useState } from "react"
import { Inbox } from "lucide-react"
import {
    useGetAdminOrdersQuery,
    useUpdateOrderStatusMutation
} from "@slices/adminApiSlice.js"
import { EmptyState } from "@components/EmptyState/index.jsx"
import { SortableTh } from "@components/SortableTh/index.jsx"
import { Skeleton } from "@components/Skeleton/index.jsx"
import { useSortedRows } from "@hooks/useSortedRows.js"
import { formatPrice } from "@utils/formatPrice.js"

const ORDER_STATUSES = ["en_attente", "payee", "en_preparation", "expediee", "livree", "annulee", "remboursee"]

const STATUS_LABELS = {
    en_attente: "En attente",
    payee: "Payee",
    en_preparation: "En preparation",
    expediee: "Expediee",
    livree: "Livree",
    annulee: "Annulee",
    remboursee: "Remboursee"
}

const formatDate = (value) => (value ? new Date(value).toLocaleString("fr-FR") : "-")

// Onglet "Commandes" : filtres + tableau triable + inline editor pour le statut.
// Donnees via RTK Query (adminApiSlice) : l'invalidation des tags "adminOrders"
// et "adminDashboard" rafraichit automatiquement les caches apres mise a jour.
export const AdminOrders = () => {
    const { data: orders = [], isLoading, isError, refetch } = useGetAdminOrdersQuery()
    const [updateOrderStatus] = useUpdateOrderStatusMutation()

    const [orderFilter, setOrderFilter] = useState({ search: "", status: "all" })
    const [orderSort, setOrderSort] = useState({ col: "created_at", dir: "desc" })
    const [orderDrafts, setOrderDrafts] = useState({})
    const [busyOrderId, setBusyOrderId] = useState(null)
    const [notice, setNotice] = useState({ type: "", text: "" })

    const filteredOrders = useMemo(() => orders.filter((order) => {
        if (orderFilter.status !== "all" && order.status !== orderFilter.status) return false
        if (!orderFilter.search) return true
        const q = orderFilter.search.toLowerCase()
        return `${order.id} ${order.customer_name || ""} ${order.email || ""}`.toLowerCase().includes(q)
    }), [orders, orderFilter])

    const sortedOrders = useSortedRows(filteredOrders, orderSort, {
        id:            (o) => o.id,
        customer_name: (o) => o.customer_name || o.email || "",
        total:         (o) => Number(o.total),
        status:        (o) => o.status,
        created_at:    (o) => new Date(o.created_at).getTime()
    })

    const handleSaveStatus = async (orderId) => {
        const status = orderDrafts[orderId]
        if (!status) return
        setBusyOrderId(orderId)
        try
        {
            await updateOrderStatus({ id: orderId, status }).unwrap()
            setNotice({ type: "success", text: `Commande #${orderId} mise a jour.` })
        }
        catch (error)
        {
            setNotice({ type: "error", text: error?.data?.message || "Impossible de mettre a jour la commande." })
        }
        setBusyOrderId(null)
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
                <p className="admin-panel__empty">Impossible de charger les commandes.</p>
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
                    <h2>Gestion des commandes <span className="admin-count-badge">{orders.length}</span></h2>
                    <p className="admin-head__subtitle">Suivi des commandes et mise a jour des statuts.</p>
                </div>
                <div className="admin-head__controls">
                    <div className="admin-filter-inline">
                        <input
                            type="search"
                            placeholder="Rechercher #id, client, email..."
                            value={orderFilter.search}
                            onChange={(event) => setOrderFilter((prev) => ({ ...prev, search: event.target.value }))}
                        />
                        <select
                            value={orderFilter.status}
                            onChange={(event) => setOrderFilter((prev) => ({ ...prev, status: event.target.value }))}
                        >
                            <option value="all">Tous statuts</option>
                            {ORDER_STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
                        </select>
                    </div>
                </div>
            </header>

            {filteredOrders.length === 0 ? (
                <EmptyState icon={Inbox} size="sm" title="Aucune commande" hint="Aucune commande ne correspond aux filtres actuels." />
            ) : (
                <div className="admin-table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <SortableTh label="ID" col="id" sort={orderSort} onSort={setOrderSort} numeric />
                                <SortableTh label="Client" col="customer_name" sort={orderSort} onSort={setOrderSort} />
                                <th>Email</th>
                                <SortableTh label="Total" col="total" sort={orderSort} onSort={setOrderSort} numeric />
                                <SortableTh label="Statut" col="status" sort={orderSort} onSort={setOrderSort} />
                                <th>Modifier</th>
                                <SortableTh label="Date" col="created_at" sort={orderSort} onSort={setOrderSort} />
                            </tr>
                        </thead>
                        <tbody>
                            {sortedOrders.map((order) => (
                                <tr key={order.id}>
                                    <td>#{order.id}</td>
                                    <td>{order.customer_name || order.email}</td>
                                    <td>{order.email}</td>
                                    <td>{formatPrice(order.total)}</td>
                                    <td>
                                        <span className={`admin-status admin-status--${order.status}`}>
                                            {STATUS_LABELS[order.status] || order.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="admin-inline-editor">
                                            <select
                                                value={orderDrafts[order.id] || order.status}
                                                onChange={(event) => setOrderDrafts((prev) => ({ ...prev, [order.id]: event.target.value }))}
                                            >
                                                {ORDER_STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
                                            </select>
                                            <button
                                                type="button"
                                                className="btn btn--outline"
                                                onClick={() => { void handleSaveStatus(order.id) }}
                                                disabled={busyOrderId === order.id || (orderDrafts[order.id] || order.status) === order.status}
                                            >
                                                {busyOrderId === order.id ? "..." : "Enregistrer"}
                                            </button>
                                        </div>
                                    </td>
                                    <td>{formatDate(order.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
