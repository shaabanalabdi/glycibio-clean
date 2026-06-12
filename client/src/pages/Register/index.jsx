import { useState } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { useAuthenticated } from "@hooks/useAuthenticated.js"
import { useDocumentMeta } from "@hooks/useDocumentMeta.js"

export const Register = () => {
    useDocumentMeta({
        title: "Inscription | GlyciBio",
        description: "Creez votre compte GlyciBio pour passer commande et suivre vos livraisons.",
        canonical: "https://glycibio.fr/register"
    })

    const [form, setForm] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        first_name: "",
        last_name: "",
        cgv: false,
        newsletter: false
    })
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const { register } = useAuthenticated()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const nextParam = searchParams.get("next")
    const next = (typeof nextParam === "string" && nextParam.startsWith("/"))
        ? nextParam
        : "/"

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setForm({ ...form, [name]: type === "checkbox" ? checked : value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")

        if (!form.cgv) {
            setError("Vous devez accepter les CGV et la politique de confidentialite")
            return
        }

        if (form.password !== form.confirmPassword) {
            setError("Les mots de passe ne correspondent pas")
            return
        }

        setLoading(true)

        try
        {
            await register({
                email: form.email,
                password: form.password,
                first_name: form.first_name,
                last_name: form.last_name,
                newsletter: form.newsletter
            })
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
                <h2>Inscription</h2>
                <p className="auth-form__subtitle">Creez votre compte GlyciBio</p>

                {error && <p className="auth-form__error" role="alert">{error}</p>}

                <div className="auth-form__row">
                    <div className="auth-form__field">
                        <label htmlFor="reg-first-name">Prenom</label>
                        <input
                            id="reg-first-name"
                            type="text"
                            name="first_name"
                            autoComplete="given-name"
                            value={form.first_name}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="auth-form__field">
                        <label htmlFor="reg-last-name">Nom</label>
                        <input
                            id="reg-last-name"
                            type="text"
                            name="last_name"
                            autoComplete="family-name"
                            value={form.last_name}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="auth-form__field">
                    <label htmlFor="reg-email">Email <span aria-hidden="true">*</span></label>
                    <input
                        id="reg-email"
                        type="email"
                        name="email"
                        autoComplete="email"
                        inputMode="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="auth-form__field">
                    <label htmlFor="reg-password">Mot de passe <span aria-hidden="true">*</span></label>
                    <input
                        id="reg-password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        autoComplete="new-password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        minLength={12}
                    />
                    <small className="auth-form__hint">Min. 12 caracteres, 1 majuscule, 1 chiffre, 1 caractere special</small>
                </div>

                <div className="auth-form__field">
                    <label htmlFor="reg-confirm">Confirmer le mot de passe <span aria-hidden="true">*</span></label>
                    <input
                        id="reg-confirm"
                        type={showPassword ? "text" : "password"}
                        name="confirmPassword"
                        autoComplete="new-password"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        required
                    />
                </div>

                <label className="auth-form__toggle">
                    <input
                        type="checkbox"
                        checked={showPassword}
                        onChange={(e) => setShowPassword(e.target.checked)}
                    />
                    Afficher les mots de passe
                </label>

                <label className="auth-form__consent">
                    <input
                        type="checkbox"
                        name="cgv"
                        checked={form.cgv}
                        onChange={handleChange}
                        required
                    />
                    <span>
                        J&apos;accepte les{" "}
                        <Link to="/cgv" target="_blank" rel="noopener noreferrer">CGV</Link>
                        {" "}et la{" "}
                        <Link to="/politique-confidentialite" target="_blank" rel="noopener noreferrer">
                            politique de confidentialite
                        </Link>
                        {" "}<span aria-hidden="true">*</span>
                    </span>
                </label>

                <label className="auth-form__consent">
                    <input
                        type="checkbox"
                        name="newsletter"
                        checked={form.newsletter}
                        onChange={handleChange}
                    />
                    <span>
                        Je souhaite recevoir la newsletter GlyciBio (conseils glycemie, nouveautes,
                        offres). Desinscription a tout moment.
                    </span>
                </label>

                <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
                    {loading ? "Inscription en cours..." : "S'inscrire"}
                </button>

                <p className="auth-form__footer">
                    Deja un compte ?{" "}
                    <Link to={next !== "/" ? `/login?next=${encodeURIComponent(next)}` : "/login"}>
                        Se connecter
                    </Link>
                </p>
            </form>
        </div>
    )
}
