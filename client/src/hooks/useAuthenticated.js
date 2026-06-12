import { useDispatch } from "react-redux"
import {
    authApiSlice,
    useGetAuthenticatedUserQuery,
    useLoginMutation,
    useRegisterMutation,
    useLogoutMutation
} from "../store/apiSlice/authApiSlice.js"
import { cartApiSlice, useMergeCartMutation } from "../store/apiSlice/cartApiSlice.js"
import { wishlistApiSlice } from "../store/apiSlice/wishlistApiSlice.js"
import { userApiSlice } from "../store/apiSlice/userApiSlice.js"
import { orderApiSlice } from "../store/apiSlice/orderApiSlice.js"
import { getGuestCart, clearGuestCart } from "../Utils/guestCart.js"

// Hook central d'authentification : etat de session (via RTK Query, cache
// partage entre tous les composants) + actions login / register / logout.
//
// Limite connue du decoupage en createApi separes : l'invalidation par tags ne
// traverse pas les instances -> au login/logout on reinitialise explicitement
// les caches dependants de la session (panier, favoris, profil, commandes).
export const useAuthenticated = () => {
    const dispatch = useDispatch()

    const {
        data: authUser,
        isLoading: isUserLoading,
        isSuccess: isUserSuccess,
        refetch
    } = useGetAuthenticatedUserQuery()

    const [loginMutation] = useLoginMutation()
    const [registerMutation] = useRegisterMutation()
    const [logoutMutation] = useLogoutMutation()
    const [mergeCartMutation] = useMergeCartMutation()

    const resetSessionCaches = () => {
        dispatch(cartApiSlice.util.resetApiState())
        dispatch(wishlistApiSlice.util.resetApiState())
        dispatch(userApiSlice.util.resetApiState())
        dispatch(orderApiSlice.util.resetApiState())
    }

    // Fusionne le panier guest (localStorage) dans le panier serveur apres login.
    const mergeGuestCart = async () => {
        const guestItems = getGuestCart()
        if (guestItems.length === 0) return

        try
        {
            await mergeCartMutation({
                items: guestItems.map((i) => ({ product_id: i.product_id, quantity: i.quantity }))
            }).unwrap()
            clearGuestCart()
        }
        catch
        {
            // best-effort : le panier guest reste en localStorage en cas d'echec
        }
    }

    const login = async (email, password) => {
        const data = await loginMutation({ email, password }).unwrap()
        resetSessionCaches()
        await mergeGuestCart()
        return data
    }

    const register = async (userData) => {
        const data = await registerMutation(userData).unwrap()
        resetSessionCaches()
        await mergeGuestCart()
        return data
    }

    const logout = async () => {
        try
        {
            await logoutMutation().unwrap()
        }
        catch
        {
            // best-effort : on deconnecte cote client meme si l'appel echoue
        }
        dispatch(authApiSlice.util.resetApiState())
        resetSessionCaches()
    }

    return {
        isAuthenticated: !!(!isUserLoading && isUserSuccess && authUser?.id),
        authUser: authUser ?? null,
        isAdmin: authUser?.role === "admin",
        isUserLoading,
        login,
        register,
        logout,
        reqAuthCheck: refetch
    }
}
