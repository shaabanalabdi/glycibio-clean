import { useState } from "react"
import { Mail, CircleCheck, X } from "lucide-react"
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

    const Icon = sent ? CircleCheck : Mail
    const title = sent
        ? "Lien de confirmation renvoye"
        : error
            ? "Envoi impossible"
            : "Confirmez votre adresse email"
    const text = sent
        ? "Verifiez votre boite mail (pensez aux spams)."
        : error || "Cliquez sur le lien recu par email pour securiser votre compte."

    return (
        <div className="verify-banner" role="status" aria-live="polite">
            <div className={`verify-banner__card${sent ? " verify-banner__card--success" : ""}`}>
                <span className="verify-banner__icon" aria-hidden="true">
                    <Icon size={20} strokeWidth={2} />
                </span>

                <div className="verify-banner__content">
                    <p className="verify-banner__title">{title}</p>
                    <p className="verify-banner__text">{text}</p>
                </div>

                {!sent && (
                    <button
                        type="button"
                        className="btn btn--sm btn--outline verify-banner__action"
                        onClick={handleResend}
                        disabled={isLoading}
                    >
                        {isLoading ? "Envoi…" : "Renvoyer le lien"}
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
        </div>
    )
}
