import { useMemo, useState } from "react"
import { UserCircle } from "lucide-react"
import {
    useGetAdminUsersQuery,
    useUpdateUserRoleMutation,
    useDeleteUserMutation
} from "@slices/adminApiSlice.js"
import { useAuthenticated } from "@hooks/useAuthenticated.js"
import { getDisplayName } from "@utils/userDisplay.js"
import { Skeleton } from "@components/Skeleton/index.jsx"

const USER_ROLES = ["client", "admin"]

const formatDate = (value) => (value ? new Date(value).toLocaleString("fr-FR") : "-")

// Onglet "Utilisateurs" : recherche + tableau avec inline editor pour role.
// L'utilisateur courant (currentUserId) ne peut pas modifier son propre role
// ni se supprimer (garde-fou cote UI ; le backend doit aussi enforcer).
// Donnees via RTK Query (adminApiSlice) : l'invalidation du tag "adminUsers"
// rafraichit automatiquement le tableau apres modification / suppression.
export const AdminUsers = () => {
    const { authUser } = useAuthenticated()
    const currentUserId = authUser?.id

    const { data: users = [], isLoading, isError, refetch } = useGetAdminUsersQuery()
    const [updateUserRole] = useUpdateUserRoleMutation()
    const [deleteUser] = useDeleteUserMutation()

    const [userFilter, setUserFilter] = useState("")
    const [userRoleDrafts, setUserRoleDrafts] = useState({})
    const [busyUserRoleId, setBusyUserRoleId] = useState(null)
    const [busyUserId, setBusyUserId] = useState(null)
    const [notice, setNotice] = useState({ type: "", text: "" })

    const filteredUsers = useMemo(() => {
        if (!userFilter) return users
        const q = userFilter.toLowerCase()
        return users.filter((row) => {
            const display = row.display_name || getDisplayName(row)
            return `${display} ${row.email || ""} ${row.role || ""}`.toLowerCase().includes(q)
        })
    }, [users, userFilter])

    const handleSaveUserRole = async (targetUser) => {
        const nextRole = userRoleDrafts[targetUser.id] || targetUser.role
        if (!nextRole || nextRole === targetUser.role) return

        setBusyUserRoleId(targetUser.id)
        try
        {
            await updateUserRole({ id: targetUser.id, role: nextRole }).unwrap()
            setNotice({ type: "success", text: `Role mis a jour pour ${targetUser.display_name || getDisplayName(targetUser)}.` })
        }
        catch (error)
        {
            setNotice({ type: "error", text: error?.data?.message || "Impossible de modifier le role." })
            setUserRoleDrafts((prev) => ({ ...prev, [targetUser.id]: targetUser.role }))
        }
        setBusyUserRoleId(null)
    }

    const handleDeleteUser = async (targetUser) => {
        const targetLabel = targetUser.display_name || getDisplayName(targetUser)
        if (targetUser.id === currentUserId) {
            setNotice({ type: "error", text: "Vous ne pouvez pas supprimer votre propre compte." })
            return
        }
        if (!window.confirm(`Supprimer le compte ${targetLabel} ?`)) return
        setBusyUserId(targetUser.id)
        try
        {
            await deleteUser(targetUser.id).unwrap()
            setUserRoleDrafts((prev) => {
                const next = { ...prev }
                delete next[targetUser.id]
                return next
            })
            setNotice({ type: "success", text: `Utilisateur ${targetLabel} supprime.` })
        }
        catch (error)
        {
            setNotice({ type: "error", text: error?.data?.message || "Suppression utilisateur impossible." })
        }
        setBusyUserId(null)
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
                <p className="admin-panel__empty">Impossible de charger les utilisateurs.</p>
                <button type="button" className="btn btn--outline" onClick={() => refetch()}>
                    Reessayer
                </button>
            </div>
        )
    }

    return (
        <div className="admin-panel">
            {notice.text && (
                <p className={`admin-console__notice admin-console__notice--${notice.type || "info"}`}>
                    {notice.text}
                </p>
            )}
            <div className="admin-panel__toolbar">
                <h2>Utilisateurs</h2>
                <div className="admin-filter-inline">
                    <input
                        type="search"
                        placeholder="Rechercher un utilisateur..."
                        value={userFilter}
                        onChange={(event) => setUserFilter(event.target.value)}
                    />
                </div>
            </div>
            {filteredUsers.length === 0 ? (
                <p className="admin-panel__empty">Aucun utilisateur trouve.</p>
            ) : (
                <div className="admin-table-wrap">
                    <table>
                        <thead><tr><th>Utilisateur</th><th>Email</th><th>Role</th><th>Etat</th><th>Inscription</th><th>Actions</th></tr></thead>
                        <tbody>
                            {filteredUsers.map((row) => (
                                <tr key={row.id}>
                                    <td>
                                        <div className="admin-user-inline">
                                            <UserCircle size={18} />
                                            <strong>{row.display_name || getDisplayName(row)}</strong>
                                        </div>
                                    </td>
                                    <td>{row.email}</td>
                                    <td>
                                        <div className="admin-inline-editor">
                                            <select
                                                value={userRoleDrafts[row.id] || row.role}
                                                onChange={(event) => setUserRoleDrafts((prev) => ({ ...prev, [row.id]: event.target.value }))}
                                                disabled={row.id === currentUserId}
                                            >
                                                {USER_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                                            </select>
                                            <button
                                                type="button"
                                                className="btn btn--outline"
                                                onClick={() => { void handleSaveUserRole(row) }}
                                                disabled={row.id === currentUserId || busyUserRoleId === row.id || (userRoleDrafts[row.id] || row.role) === row.role}
                                            >
                                                {busyUserRoleId === row.id ? "..." : "Save"}
                                            </button>
                                        </div>
                                    </td>
                                    <td>{row.is_active ? "Actif" : "Inactif"}</td>
                                    <td>{formatDate(row.created_at)}</td>
                                    <td>
                                        <button
                                            type="button"
                                            className="btn btn--outline admin-danger"
                                            onClick={() => { void handleDeleteUser(row) }}
                                            disabled={busyUserId === row.id || row.id === currentUserId}
                                        >
                                            {busyUserId === row.id ? "..." : "Supprimer"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
