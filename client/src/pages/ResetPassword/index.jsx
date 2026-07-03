import { useState } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { useResetPasswordMutation } from "@slices/authApiSlice.js"
import { checkPassword, isPasswordStrong } from "@utils/passwordPolicy.js"

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

    // Etat, en direct, de chaque regle de la politique de mot de passe (retour visuel).
    const passwordChecks = checkPassword(passwords.new_password)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setMsg("")

        if (!isPasswordStrong(passwords.new_password)) {
            setError("Le mot de passe ne respecte pas la politique de securite (voir les regles sous le champ)")
            document.getElementById("new_password")?.focus()
            return
        }

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
                    <div className="auth__success" role="status" aria-live="polite">
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
                                enterKeyHint="next"
                                value={passwords.new_password}
                                onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                                required
                                minLength={12}
                                autoComplete="new-password"
                                aria-describedby="reset-password-hint"
                            />
                            <small id="reset-password-hint">Min. 12 caracteres, 1 minuscule, 1 majuscule, 1 chiffre, 1 caractere special</small>
                            {passwords.new_password.length > 0 && (
                                <ul className="pwd-rules" aria-label="Exigences du mot de passe" aria-live="polite">
                                    {passwordChecks.map((c) => (
                                        <li key={c.key} className={`pwd-rules__item ${c.ok ? "is-valid" : "is-invalid"}`}>
                                            <span className="pwd-rules__icon" role="img" aria-label={c.ok ? "satisfait" : "non satisfait"}>{c.ok ? "✓" : "○"}</span>
                                            {c.label}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="auth__field">
                            <label htmlFor="confirm_password">Confirmer le mot de passe</label>
                            <input
                                id="confirm_password"
                                type="password"
                                enterKeyHint="go"
                                value={passwords.confirm_password}
                                onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })}
                                required
                                minLength={12}
                                autoComplete="new-password"
                                aria-describedby="reset-password-hint"
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
