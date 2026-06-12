import { useAuthenticated } from "./useAuthenticated.js"
import {
    useGetWishlistIdsQuery,
    useAddToWishlistMutation,
    useRemoveFromWishlistMutation
} from "../store/apiSlice/wishlistApiSlice.js"

// Hook favoris : liste des product_ids (cache RTK partage) + bascule.
export const useWishlist = () => {
    const { isAuthenticated } = useAuthenticated()

    const { data: ids, isLoading: loading, refetch } = useGetWishlistIdsQuery(undefined, { skip: !isAuthenticated })
    const [addToWishlist] = useAddToWishlistMutation()
    const [removeFromWishlist] = useRemoveFromWishlistMutation()

    const has = (productId) => (ids ?? []).includes(productId)

    const toggle = async (productId) => {
        if (!isAuthenticated) return { ok: false, message: "Connexion requise" }

        try
        {
            if (has(productId)) {
                await removeFromWishlist(productId).unwrap()
            } else {
                await addToWishlist(productId).unwrap()
            }
            return { ok: true }
        }
        catch (error)
        {
            return { ok: false, message: error?.data?.message || "Une erreur est survenue" }
        }
    }

    return {
        ids: new Set(ids ?? []),
        loading,
        has,
        toggle,
        refresh: refetch
    }
}
