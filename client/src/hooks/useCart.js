import { useState, useEffect } from "react"
import { useAuthenticated } from "./useAuthenticated.js"
import { useGetCartQuery, useAddToCartMutation } from "../store/apiSlice/cartApiSlice.js"
import { getGuestCartCount, addGuestCartItem, clearGuestCart } from "../Utils/guestCart.js"

// Hook panier : compose le panier serveur (RTK Query, utilisateur connecte)
// avec le panier guest (localStorage, anonyme). Le badge et l'ajout routent
// automatiquement selon l'etat d'authentification.
export const useCart = () => {
    const { isAuthenticated, isUserLoading } = useAuthenticated()

    const { data: cart, refetch } = useGetCartQuery(undefined, { skip: !isAuthenticated })
    const [addToCartMutation] = useAddToCartMutation()

    const [guestCount, setGuestCount] = useState(() =>
        typeof window === "undefined" ? 0 : getGuestCartCount()
    )

    // Synchronise le badge avec les mutations du guest cart (autres onglets compris)
    useEffect(() => {
        if (isAuthenticated) return undefined
        const onChange = () => setGuestCount(getGuestCartCount())
        window.addEventListener("guest-cart-change", onChange)
        window.addEventListener("storage", onChange)
        return () => {
            window.removeEventListener("guest-cart-change", onChange)
            window.removeEventListener("storage", onChange)
        }
    }, [isAuthenticated])

    const serverCount = cart?.items
        ? cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
        : 0

    // Ajoute un produit au panier. Route guest vs serveur selon l'auth.
    // @returns {{ ok: boolean, message?: string }}
    const addToCart = async (product, quantity = 1) => {
        if (!isAuthenticated) {
            const res = addGuestCartItem(product, quantity)
            if (res.ok) setGuestCount(getGuestCartCount())
            return res
        }

        try
        {
            await addToCartMutation({ product_id: product.id, quantity }).unwrap()
            return { ok: true }
        }
        catch (error)
        {
            return { ok: false, message: error?.data?.message || "Erreur d'ajout au panier" }
        }
    }

    const resetCart = () => {
        if (!isAuthenticated) {
            clearGuestCart()
            setGuestCount(0)
        }
    }

    return {
        cart: cart ?? null,
        cartCount: isAuthenticated ? serverCount : guestCount,
        isGuestCart: !isAuthenticated && !isUserLoading,
        addToCart,
        resetCart,
        refreshCartCount: refetch
    }
}
