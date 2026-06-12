import { useMemo, useState } from "react"
import { Inbox, LayoutDashboard, Mail, Package, PackageSearch, ShoppingBag, Users } from "lucide-react"
import {
    useGetDashboardQuery,
    useGetAdminProductsQuery,
    useGetAdminShippingQuery,
    useGetAdminContactsQuery
} from "@slices/adminApiSlice.js"
import { RevenueChart } from "@components/RevenueChart/index.jsx"
import { EmptyState } from "@components/EmptyState/index.jsx"
import { SortableTh } from "@components/SortableTh/index.jsx"
import { Skeleton } from "@components/Skeleton/index.jsx"
import { useSortedRows } from "@hooks/useSortedRows.js"
import { formatPrice } from "@utils/formatPrice"

const STATUS_LABELS = {
    en_attente: "En attente",
    payee: "Payee",
    en_preparation: "En preparation",
    expediee: "Expediee",
    livree: "Livree",
    annulee: "Annulee"
}

const formatDate = (value) => (value ? new Date(value).toLocaleString("fr-FR") : "-")

// Onglet "Vue d'ensemble" : KPI cards + revenue chart + top produits + dernieres commandes.
// Donnees via RTK Query (dashboard + produits/livraisons/messages pour les compteurs derives).
export const AdminOverview = () => {
    const { data: dashboard, isLoading, isError, refetch } = useGetDashboardQuery()
    const { data: products = [] } = useGetAdminProductsQuery()
    const { data: shippingMethods = [] } = useGetAdminShippingQuery()
    const { data: messages = [] } = useGetAdminContactsQuery()

    const [topSort, setTopSort] = useState({ col: "total_vendu", dir: "desc" })

    const overview = dashboard ?? { kpi: null, topProducts: [], recentOrders: [], revenue30d: [] }
    const kpi = overview.kpi || {}

    const activeProductsCount = useMemo(() => products.filter((p) => !!p.is_active).length, [products])
    const inactiveProductsCount = products.length - activeProductsCount
    const lowStockCount = useMemo(() => products.filter((p) => !!p.is_active && Number(p.stock) <= 5).length, [products])
    const activeShippingCount = shippingMethods.filter((m) => !!m.is_active).length
    const unreadMessagesCount = messages.filter((m) => !m.is_read).length

    const sortedTopProducts = useSortedRows(overview.topProducts, topSort, {
        name:        (p) => p.name,
        total_vendu: (p) => Number(p.total_vendu),
        revenue:     (p) => Number(p.revenue)
    })

    if (isLoading) {
        return (
            <div className="admin-overview" aria-busy="true">
                <Skeleton width="100%" height="120px" />
                <Skeleton width="100%" height="260px" style={{ marginTop: "1rem" }} />
            </div>
        )
    }

    if (isError) {
        return (
            <div className="admin-panel">
                <p className="admin-panel__empty">Impossible de charger le tableau de bord.</p>
                <button type="button" className="btn btn--outline" onClick={() => refetch()}>Reessayer</button>
            </div>
        )
    }

    return (
        <div className="admin-overview">
            <div className="admin-kpi-grid">
                <article className="admin-kpi-card"><ShoppingBag size={18} /><p>Commandes valides</p><strong>{kpi.total_commandes_payees || 0}</strong></article>
                <article className="admin-kpi-card"><LayoutDashboard size={18} /><p>Chiffre d affaires</p><strong>{formatPrice(kpi.chiffre_affaires)}</strong></article>
                <article className="admin-kpi-card"><Users size={18} /><p>Clients actifs</p><strong>{kpi.total_clients || 0}</strong></article>
                <article className="admin-kpi-card"><Package size={18} /><p>Produits actifs</p><strong>{activeProductsCount}</strong></article>
                <article className="admin-kpi-card"><Package size={18} /><p>Produits inactifs</p><strong>{inactiveProductsCount}</strong></article>
                <article className="admin-kpi-card"><Package size={18} /><p>Stock critique (&lt;= 5)</p><strong>{lowStockCount}</strong></article>
                <article className="admin-kpi-card"><ShoppingBag size={18} /><p>Livraisons actives</p><strong>{activeShippingCount}</strong></article>
                <article className="admin-kpi-card"><Mail size={18} /><p>Messages non lus</p><strong>{kpi.messages_non_lus || unreadMessagesCount}</strong></article>
            </div>

            {overview.revenue30d && overview.revenue30d.length > 0 && (
                <RevenueChart data={overview.revenue30d} />
            )}

            <div className="admin-data-grid">
                <article className="admin-panel">
                    <h2>Top produits</h2>
                    {overview.topProducts.length === 0 ? (
                        <EmptyState icon={PackageSearch} size="sm" title="Aucune vente enregistree" hint="Les meilleures ventes apparaitront ici." />
                    ) : (
                        <div className="admin-table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <SortableTh label="Produit" col="name" sort={topSort} onSort={setTopSort} />
                                        <SortableTh label="Vendus" col="total_vendu" sort={topSort} onSort={setTopSort} numeric />
                                        <SortableTh label="Revenu" col="revenue" sort={topSort} onSort={setTopSort} numeric />
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedTopProducts.map((product) => (
                                        <tr key={product.id}>
                                            <td>{product.name}</td>
                                            <td>{product.total_vendu}</td>
                                            <td>{formatPrice(product.revenue)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </article>

                <article className="admin-panel">
                    <h2>Dernieres commandes</h2>
                    {overview.recentOrders.length === 0 ? (
                        <EmptyState icon={Inbox} size="sm" title="Aucune commande recente" hint="Les nouvelles commandes s'afficheront ici." />
                    ) : (
                        <div className="admin-table-wrap">
                            <table>
                                <thead><tr><th>ID</th><th>Client</th><th>Total</th><th>Statut</th><th>Date</th></tr></thead>
                                <tbody>
                                    {overview.recentOrders.map((order) => (
                                        <tr key={order.id}>
                                            <td>#{order.id}</td>
                                            <td>{order.customer_name || order.email}</td>
                                            <td>{formatPrice(order.total)}</td>
                                            <td><span className={`admin-status admin-status--${order.status}`}>{STATUS_LABELS[order.status] || order.status}</span></td>
                                            <td>{formatDate(order.created_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </article>
            </div>
        </div>
    )
}
