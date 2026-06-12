import { useEffect } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { CheckCircle } from "lucide-react"
import { useConfirmPaymentQuery } from "@slices/paymentApiSlice.js"
import { useDocumentMeta } from "@hooks/useDocumentMeta.js"
import { formatPrice } from "@utils/formatPrice.js"

export const OrderSuccess = () => {
    useDocumentMeta({
        title: "Commande confirmee | GlyciBio",
        description: "Votre commande a bien ete enregistree.",
        noIndex: true
    })

    const [searchParams] = useSearchParams()
    const sessionId = searchParams.get("session_id")
    const navigate = useNavigate()

    const {
        data: order,
        isLoading,
        isError,
        error
    } = useConfirmPaymentQuery(sessionId, { skip: !sessionId })

    useEffect(() => {
        if (!sessionId) {
            navigate("/profil")
        }
    }, [sessionId, navigate])

    if (!sessionId || isLoading) return <p className="page-loading">Verification du paiement...</p>

    if (isError) {
        return (
            <div className="checkout-success">
                <p className="checkout-success__error">
                    {error?.data?.message || "Impossible de confirmer le paiement"}
                </p>
                <Link to="/profil" className="btn btn--primary">Voir mes commandes</Link>
            </div>
        )
    }

    return (
        <div className="checkout-success">
            <div className="checkout-success__icon">
                <CheckCircle size={64} color="#2d6a4f" />
            </div>
            <h1>Paiement confirme !</h1>
            <p>Merci pour votre commande <strong>#{order?.id}</strong>.</p>
            <p>Un email de confirmation vous a ete envoye.</p>
            {order && (
                <p><strong>Total paye : {formatPrice(order.total)}</strong></p>
            )}
            <div className="checkout-success__actions">
                <Link to="/profil" className="btn btn--outline">Mes commandes</Link>
                <Link to="/catalogue" className="btn btn--primary">Continuer les achats</Link>
            </div>
        </div>
    )
}
