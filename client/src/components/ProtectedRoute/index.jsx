import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuthenticated } from "../../hooks/useAuthenticated.js"

export const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { authUser, isAdmin, isUserLoading } = useAuthenticated()
    const location = useLocation()

    if (isUserLoading) return <p className="page-loading">Chargement...</p>

    if (!authUser) {
        // Preserve la destination demandee pour le redirect post-login
        const next = location.pathname + location.search
        const target = next && next !== "/login"
            ? `/login?next=${encodeURIComponent(next)}`
            : "/login"
        return <Navigate to={target} replace />
    }

    if (adminOnly && !isAdmin) return <Navigate to="/" replace />

    return children ?? <Outlet />
}
