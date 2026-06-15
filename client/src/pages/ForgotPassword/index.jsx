import { useState } from "react"
import { Link } from "react-router-dom"
import { useForgotPasswordMutation } from "@slices/authApiSlice.js"

export const ForgotPassword = () => {
    const [email, setEmail] = useState("")
    const [msg, setMsg] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [forgotPassword, { isLoading }] = useForgotPasswordMutation()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setMsg("")

        try
        {
            const data = await forgotPassword({ email }).unwrap()
            setSubmitted(true)
            setMsg(data.message)
        }
        catch (error)
        {
            setMsg(error?.data?.message || "Une erreur est survenue")
        }
    }

    return (
        <div className="auth">
            <div className="auth__card">
                <h1 className="auth__title">Mot de passe oublie ?</h1>

                {submitted ? (
                    <div className="auth__success">
                        <p>{msg}</p>
                        <p>Verifiez votre boite email et cliquez sur le lien recu.</p>
                        <Link to="/login" className="btn btn--primary btn--full auth__cta">
                            Retour a la connexion
                        </Link>
                    </div>
                ) : (
                    <>
                        <p className="auth__subtitle">
                            Entrez votre adresse email pour recevoir un lien de reinitialisation.
                        </p>

                        <form onSubmit={handleSubmit} className="auth__form">
                            {msg && <p className="auth__error" role="alert">{msg}</p>}

                            <div className="auth__field">
                                <label htmlFor="email">Adresse email</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="votre@email.fr"
                                    required
                                    autoComplete="email"
                                />
                            </div>

                            <button type="submit" className="btn btn--primary btn--full" disabled={isLoading}>
                                {isLoading ? "Envoi en cours..." : "Envoyer le lien"}
                            </button>
                        </form>

                        <p className="auth__link">
                            <Link to="/login">Retour a la connexion</Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    )
}
