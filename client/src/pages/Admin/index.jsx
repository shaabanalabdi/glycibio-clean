import "./style.scss"
import { useState } from "react"
import { Mail, Package, ShoppingBag, Users, LayoutDashboard } from "lucide-react"
import { useGetAdminProductsQuery } from "@slices/adminApiSlice.js"
import { useGetAdminCategoriesQuery } from "@slices/adminApiSlice.js"
import { useGetAdminShippingQuery } from "@slices/adminApiSlice.js"
import { useGetAdminOrdersQuery } from "@slices/adminApiSlice.js"
import { useGetAdminContactsQuery } from "@slices/adminApiSlice.js"
import { useGetAdminUsersQuery } from "@slices/adminApiSlice.js"
import { useGetAdminReviewsQuery } from "@slices/adminApiSlice.js"
import { AdminOverview } from "@components/AdminOverview/index.jsx"
import { AdminProducts } from "@components/AdminProducts/index.jsx"
import { AdminCategories } from "@components/AdminCategories/index.jsx"
import { AdminShipping } from "@components/AdminShipping/index.jsx"
import { AdminOrders } from "@components/AdminOrders/index.jsx"
import { AdminMessages } from "@components/AdminMessages/index.jsx"
import { AdminReviews } from "@components/AdminReviews/index.jsx"
import { AdminUsers } from "@components/AdminUsers/index.jsx"

// Hub admin : barre d'onglets + rendu de l'onglet actif. Chaque onglet est un
// composant autonome qui possede ses propres donnees (RTK Query) et mutations
// — le hub ne fait plus de prop-drilling. Les compteurs des onglets lisent les
// memes caches RTK (partages, donc sans requete supplementaire).
export const Admin = () => {
    const [activeTab, setActiveTab] = useState("overview")

    const { data: products = [] } = useGetAdminProductsQuery()
    const { data: categories = [] } = useGetAdminCategoriesQuery()
    const { data: shippingMethods = [] } = useGetAdminShippingQuery()
    const { data: orders = [] } = useGetAdminOrdersQuery()
    const { data: messages = [] } = useGetAdminContactsQuery()
    const { data: users = [] } = useGetAdminUsersQuery()
    const { data: pendingReviews = [] } = useGetAdminReviewsQuery("pending")

    const unreadMessagesCount = messages.filter((message) => !message.is_read).length

    const tabs = [
        { id: "overview", label: "Overview", icon: LayoutDashboard, count: null },
        { id: "products", label: "Products", icon: Package, count: products.length },
        { id: "categories", label: "Categories", icon: Package, count: categories.length },
        { id: "shipping", label: "Shipping", icon: ShoppingBag, count: shippingMethods.length },
        { id: "orders", label: "Orders", icon: ShoppingBag, count: orders.length },
        { id: "messages", label: "Messages", icon: Mail, count: unreadMessagesCount },
        { id: "reviews", label: "Reviews", icon: Mail, count: pendingReviews.length },
        { id: "users", label: "Users", icon: Users, count: users.length }
    ]

    return (
        <section className="admin-console">
            <header className="admin-console__header">
                <div>
                    <h1>Admin Console</h1>
                    <p>Gestion complete e-commerce : catalogue, commandes, livraison, clients et support.</p>
                </div>
            </header>

            <nav className="admin-tabs">
                {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            className={`admin-tabs__button ${activeTab === tab.id ? "admin-tabs__button--active" : ""}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <Icon size={18} />
                            <span>{tab.label}</span>
                            {tab.count !== null && <small>{tab.count}</small>}
                        </button>
                    )
                })}
            </nav>

            {activeTab === "overview" && <AdminOverview />}
            {activeTab === "products" && <AdminProducts />}
            {activeTab === "categories" && <AdminCategories />}
            {activeTab === "shipping" && <AdminShipping />}
            {activeTab === "orders" && <AdminOrders />}
            {activeTab === "messages" && <AdminMessages />}
            {activeTab === "reviews" && <AdminReviews />}
            {activeTab === "users" && <AdminUsers />}
        </section>
    )
}
