import "./style.scss"
import { Link } from "react-router-dom"
import { Heart, HeartCrack } from "lucide-react"
import { useGetWishlistQuery } from "@slices/wishlistApiSlice.js"
import { ProductCard } from "@components/ProductCard/index.jsx"
import { Breadcrumb } from "@components/Breadcrumb/index.jsx"
import { EmptyState } from "@components/EmptyState/index.jsx"
import { useDocumentMeta } from "@hooks/useDocumentMeta.js"

export const Wishlist = () => {
    useDocumentMeta({
        title: "Mes favoris | GlyciBio",
        description: "Retrouvez tous les produits que vous avez ajoutes a vos favoris.",
        canonical: "https://glycibio.fr/favoris"
    })

    const { data, isLoading } = useGetWishlistQuery()
    const items = data ?? []

    return (
        <div className="wishlist-page">
            <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Mes favoris" }]} />

            <h1 className="wishlist-page__title">
                <Heart size={28} fill="currentColor" /> Mes favoris
            </h1>

            {isLoading ? (
                <p className="page-loading">Chargement...</p>
            ) : items.length === 0 ? (
                <EmptyState
                    icon={HeartCrack}
                    title="Aucun favori pour le moment"
                    hint="Cliquez sur le coeur d'un produit pour l'ajouter ici et le retrouver facilement."
                    action={<Link to="/catalogue" className="btn btn--primary">Decouvrir le catalogue</Link>}
                />
            ) : (
                <div className="wishlist-page__grid">
                    {items.map((it) => (
                        <ProductCard key={it.id} product={it} />
                    ))}
                </div>
            )}
        </div>
    )
}
