import { useState } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { useResetPasswordMutation } from "@slices/authApiSlice.js"

export const ResetPassword = () => {
    const [searchParams] = useSearchParams()
    const token = searchParams.get("token") || ""
    const navigate = useNavigate()

    const [passwords, setPasswords] = useState({ new_password: "", confirm_password: "" })
    const [msg, setMsg] = useState("")
    const [error, setError] = useState("")
    const [resetPassword, { isLoading }] = useResetPasswordMutation()

    if (!token) {
        return (
            <div className="auth">
                <div className="auth__card">
                    <h1 className="auth__title">Lien invalide</h1>
                    <p>Ce lien de reinitialisation est invalide ou a expire.</p>
                    <Link to="/mot-de-passe-oublie" className="btn btn--primary btn--full auth__cta">
                        Faire une nouvelle demande
                    </Link>
                </div>
            </div>
        )
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setMsg("")

        if (passwords.new_password !== passwords.confirm_password) {
            setError("Les mots de passe ne correspondent pas")
            document.getElementById("confirm_password")?.focus()
            return
        }

        try
        {
            const data = await resetPassword({
                token,
                new_password: passwords.new_password
            }).unwrap()
            setMsg(data.message)
            setTimeout(() => navigate("/login"), 2500)
        }
        catch (err)
        {
            setError(err?.data?.message || "Une erreur est survenue")
        }
    }

    return (
        <div className="auth">
            <div className="auth__card">
                <h1 className="auth__title">Nouveau mot de passe</h1>

                {msg ? (
                    <div className="auth__success">
                        <p>{msg}</p>
                        <p>Redirection vers la connexion...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="auth__form">
                        {error && <p className="auth__error" role="alert">{error}</p>}

                        <div className="auth__field">
                            <label htmlFor="new_password">Nouveau mot de passe</label>
                            <input
                                id="new_password"
                                type="password"
                                value={passwords.new_password}
                                onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                                required
                                minLength={12}
                                autoComplete="new-password"
                            />
                            <small>Min. 12 caracteres, 1 majuscule, 1 chiffre, 1 caractere special</small>
                        </div>

                        <div className="auth__field">
                            <label htmlFor="confirm_password">Confirmer le mot de passe</label>
                            <input
                                id="confirm_password"
                                type="password"
                                value={passwords.confirm_password}
                                onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })}
                                required
                                minLength={12}
                                autoComplete="new-password"
                            />
                        </div>

                        <button type="submit" className="btn btn--primary btn--full" disabled={isLoading}>
                            {isLoading ? "Modification en cours..." : "Reinitialiser le mot de passe"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
