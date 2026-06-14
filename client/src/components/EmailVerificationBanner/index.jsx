import { useState } from "react"
import { Mail, X } from "lucide-react"
import {
    useGetAuthenticatedUserQuery,
    useResendVerificationMutation
} from "@slices/authApiSlice.js"
import "./style.scss"

// Banniere "verification souple" : visible uniquement si l'utilisateur est
// connecte ET que son email n'est PAS verifie. Permet de renvoyer le lien.
// Masquable pour la session en cours (reapparait a la prochaine visite).
export const EmailVerificationBanner = () => {
    const { data: authUser } = useGetAuthenticatedUserQuery()
    const [resendVerification, { isLoading }] = useResendVerificationMutation()
    const [dismissed, setDismissed] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState("")

    // N'afficher que pour un compte connecte dont l'email est explicitement non verifie
    if (!authUser || authUser.email_verified !== false || dismissed) return null

    const handleResend = async () => {
        setError("")
        try
        {
            await resendVerification().unwrap()
            setSent(true)
        }
        catch (err)
        {
            setError(err?.data?.message || "Echec de l'envoi. Reessayez plus tard.")
        }
    }

    return (
        <div className="verify-banner" role="alert">
            <Mail size={20} aria-hidden="true" className="verify-banner__icon" />
            <p className="verify-banner__text">
                {sent
                    ? "Lien de confirmation renvoye. Verifiez votre boite mail (pensez aux spams)."
                    : error || "Confirmez votre adresse email pour securiser votre compte."}
            </p>
            {!sent && (
                <button
                    type="button"
                    className="btn btn--sm btn--outline verify-banner__action"
                    onClick={handleResend}
                    disabled={isLoading}
                >
                    {isLoading ? "Envoi..." : "Renvoyer le lien"}
                </button>
            )}
            <button
                type="button"
                className="verify-banner__close"
                onClick={() => setDismissed(true)}
                aria-label="Masquer cette notification"
            >
                <X size={18} aria-hidden="true" />
            </button>
        </div>
    )
}
