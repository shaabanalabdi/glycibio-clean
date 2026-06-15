import { useEffect, useRef, useState } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { useVerifyEmailMutation } from "@slices/authApiSlice.js"

// Page de confirmation d'email : lit ?token=, appelle l'API au montage, et
// affiche l'etat (verification / succes / erreur / lien manquant).
export const VerifyEmail = () => {
    const [searchParams] = useSearchParams()
    const token = searchParams.get("token") || ""
    const [verifyEmail] = useVerifyEmailMutation()

    const [status, setStatus] = useState(token ? "verifying" : "missing")
    const [message, setMessage] = useState("")
    const ranRef = useRef(false)

    useEffect(() => {
        if (!token || ranRef.current) return
        ranRef.current = true // garde anti double-appel (React StrictMode + token a usage unique)

        verifyEmail({ token })
            .unwrap()
            .then((data) => {
                setStatus("success")
                setMessage(data?.message || "Adresse email confirmee avec succes.")
            })
            .catch((err) => {
                setStatus("error")
                setMessage(err?.data?.message || "Lien de verification invalide ou expire.")
            })
    }, [token, verifyEmail])

    return (
        <div className="auth">
            <div className="auth__card">
                <h1 className="auth__title">Confirmation de l'email</h1>

                {status === "missing" && (
                    <>
                        <p className="auth__error" role="alert">Lien de confirmation invalide : aucun jeton fourni.</p>
                        <Link to="/" className="btn btn--primary btn--full auth__cta">
                            Retour a l'accueil
                        </Link>
                    </>
                )}

                {status === "verifying" && (
                    <p role="status">Verification de votre adresse email en cours...</p>
                )}

                {status === "success" && (
                    <div className="auth__success">
                        <p>{message}</p>
                        <Link to="/" className="btn btn--primary btn--full auth__cta">
                            Continuer
                        </Link>
                    </div>
                )}

                {status === "error" && (
                    <>
                        <p className="auth__error" role="alert">{message}</p>
                        <p>Connectez-vous puis demandez un nouveau lien depuis la banniere en haut de page.</p>
                        <Link to="/login" className="btn btn--primary btn--full auth__cta">
                            Se connecter
                        </Link>
                    </>
                )}
            </div>
        </div>
    )
}
