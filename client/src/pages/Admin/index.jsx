import "./style.scss"
import { useState } from "react"
import { FolderTree, LayoutDashboard, Mail, Package, ShoppingBag, Star, Truck, Users } from "lucide-react"
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

// Hub admin : barre laterale groupee + rendu du panneau de l'onglet actif.
// Chaque onglet est un composant autonome qui possede ses propres donnees
// (RTK Query) et mutations — le hub ne fait plus de prop-drilling. Les
// compteurs de la nav lisent les memes caches RTK (partages, donc sans
// requete supplementaire).
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

    // Nav groupee : 4 sections fonctionnelles. `alert` => compteur en ton
    // ambre (action requise) et masque quand 0 pour reduire le bruit.
    const navGroups = [
        {
            label: "Tableau de bord",
            items: [
                { id: "overview", label: "Vue d'ensemble", icon: LayoutDashboard }
            ]
        },
        {
            label: "Catalogue",
            items: [
                { id: "products", label: "Produits", icon: Package, count: products.length },
                { id: "categories", label: "Categories", icon: FolderTree, count: categories.length }
            ]
        },
        {
            label: "Ventes",
            items: [
                { id: "orders", label: "Commandes", icon: ShoppingBag, count: orders.length },
                { id: "shipping", label: "Livraison", icon: Truck, count: shippingMethods.length }
            ]
        },
        {
            label: "Relation client",
            items: [
                { id: "messages", label: "Messages", icon: Mail, count: unreadMessagesCount, alert: unreadMessagesCount > 0 },
                { id: "reviews", label: "Avis", icon: Star, count: pendingReviews.length, alert: pendingReviews.length > 0 },
                { id: "users", label: "Utilisateurs", icon: Users, count: users.length }
            ]
        }
    ]

    return (
        <section className="admin-console">
            <nav className="admin-nav" aria-label="Navigation administration">
                <div className="admin-nav__brand">
                    <h1>Admin GlyciBio</h1>
                    <p>Console de gestion</p>
                </div>

                {navGroups.map((group) => (
                    <div className="admin-nav__group" key={group.label}>
                        <p className="admin-nav__group-label">{group.label}</p>
                        {group.items.map((item) => {
                            const Icon = item.icon
                            const showCount = item.count != null && (item.count > 0 || !item.alert)
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    className={`admin-nav__link ${activeTab === item.id ? "admin-nav__link--active" : ""}`}
                                    onClick={() => setActiveTab(item.id)}
                                    aria-current={activeTab === item.id ? "page" : undefined}
                                >
                                    <Icon size={18} aria-hidden="true" />
                                    <span>{item.label}</span>
                                    {showCount && (
                                        <small className={`admin-nav__count ${item.alert ? "admin-nav__count--alert" : ""}`}>
                                            {item.count}
                                        </small>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                ))}
            </nav>

            <div className="admin-main">
                {activeTab === "overview" && <AdminOverview />}
                {activeTab === "products" && <AdminProducts />}
                {activeTab === "categories" && <AdminCategories />}
                {activeTab === "shipping" && <AdminShipping />}
                {activeTab === "orders" && <AdminOrders />}
                {activeTab === "messages" && <AdminMessages />}
                {activeTab === "reviews" && <AdminReviews />}
                {activeTab === "users" && <AdminUsers />}
            </div>
        </section>
    )
}
