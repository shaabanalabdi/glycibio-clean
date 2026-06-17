import { useState } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { useAuthenticated } from "@hooks/useAuthenticated.js"
import { useDocumentMeta } from "@hooks/useDocumentMeta.js"

export const Login = () => {
    useDocumentMeta({
        title: "Connexion | GlyciBio",
        description: "Connectez-vous a votre compte GlyciBio pour suivre vos commandes.",
        canonical: "https://glycibio.fr/login"
    })

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [fieldErrors, setFieldErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const { login } = useAuthenticated()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    // ?next=/commande -> on revient au flow d'achat apres login
    const nextParam = searchParams.get("next")
    const next = (typeof nextParam === "string" && nextParam.startsWith("/"))
        ? nextParam
        : "/"

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")

        const errs = {}
        if (!email.trim()) errs.email = "L'adresse email est requise."
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Adresse email invalide."
        if (!password) errs.password = "Le mot de passe est requis."
        setFieldErrors(errs)
        if (Object.keys(errs).length > 0) {
            document.getElementById(errs.email ? "login-email" : "login-password")?.focus()
            return
        }

        setLoading(true)

        try
        {
            await login(email, password)
            navigate(next, { replace: true })
        }
        catch (err)
        {
            setError(err?.data?.message || "Une erreur est survenue")
        }
        finally
        {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <form onSubmit={handleSubmit} className="auth-form" noValidate>
                <h1>Connexion</h1>
                <p className="auth-form__subtitle">Connectez-vous a votre compte</p>

                {error && <p className="auth-form__error" role="alert">{error}</p>}

                <div className="auth-form__field">
                    <label htmlFor="login-email">Email <span aria-hidden="true">*</span></label>
                    <input
                        id="login-email"
                        type="email"
                        inputMode="email"
                        enterKeyHint="next"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: "" })) }}
                        required
                        aria-invalid={!!fieldErrors.email}
                        aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
                    />
                    {fieldErrors.email && <small id="login-email-error" className="auth-form__field-error" role="alert">{fieldErrors.email}</small>}
                </div>

                <div className="auth-form__field">
                    <label htmlFor="login-password">Mot de passe <span aria-hidden="true">*</span></label>
                    <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        enterKeyHint="go"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: "" })) }}
                        required
                        aria-invalid={!!fieldErrors.password}
                        aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
                    />
                    {fieldErrors.password && <small id="login-password-error" className="auth-form__field-error" role="alert">{fieldErrors.password}</small>}
                </div>

                <label className="auth-form__toggle">
                    <input
                        type="checkbox"
                        checked={showPassword}
                        onChange={(e) => setShowPassword(e.target.checked)}
                    />
                    Afficher le mot de passe
                </label>

                <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
                    {loading ? "Connexion en cours..." : "Se connecter"}
                </button>

                <p className="auth-form__footer">
                    Pas encore de compte ?{" "}
                    <Link to={next !== "/" ? `/register?next=${encodeURIComponent(next)}` : "/register"}>
                        S&apos;inscrire
                    </Link>
                </p>
                <p className="auth-form__footer">
                    <Link to="/mot-de-passe-oublie">Mot de passe oublie ?</Link>
                </p>
            </form>
        </div>
    )
}
