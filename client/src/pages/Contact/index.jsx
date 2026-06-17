import "./style.scss"
import { useState } from "react"
import { Send, Mail, User, MessageSquare } from "lucide-react"
import { useSendMessageMutation } from "@slices/contactApiSlice.js"
import { useDocumentMeta } from "@hooks/useDocumentMeta.js"

export const Contact = () => {
    useDocumentMeta({
        title: "Contact | GlyciBio",
        description: "Une question sur nos produits a index glycemique controle ? Contactez notre equipe.",
        canonical: "https://glycibio.fr/contact"
    })

    const [form, setForm] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
        website: "" // honeypot - doit rester vide
    })
    const [status, setStatus] = useState("")
    const [error, setError] = useState("")
    const [fieldErrors, setFieldErrors] = useState({})
    const [sendMessage, { isLoading: submitting }] = useSendMessageMutation()

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
        setFieldErrors((p) => ({ ...p, [e.target.name]: "" }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (submitting) return // evite la double-soumission (double-clic / connexion lente)
        setStatus("")
        setError("")

        const errs = {}
        if (!form.name.trim()) errs.name = "Votre nom est requis."
        if (!form.email.trim()) errs.email = "L'adresse email est requise."
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Adresse email invalide."
        if (!form.subject.trim()) errs.subject = "Le sujet est requis."
        if (!form.message.trim()) errs.message = "Le message est requis."
        setFieldErrors(errs)
        if (Object.keys(errs).length > 0) {
            document.getElementById(`contact-${Object.keys(errs)[0]}`)?.focus()
            return
        }

        try
        {
            await sendMessage(form).unwrap()
            setStatus("Message envoye avec succes ! Nous vous repondrons rapidement.")
            setForm({ name: "", email: "", subject: "", message: "", website: "" })
        }
        catch (err)
        {
            setError(err?.data?.message || "Une erreur est survenue. Reessayez.")
        }
    }

    return (
        <div className="contact">
            <div className="contact__header">
                <h1>Contactez-nous</h1>
                <p>Une question ? Un conseil ? Nous sommes la pour vous aider.</p>
            </div>

            <div className="contact__content">
                <form onSubmit={handleSubmit} className="contact__form" noValidate>
                    {/* Honeypot - cache aux humains, rempli par les bots */}
                    <div className="contact__honeypot" aria-hidden="true">
                        <label htmlFor="contact-website">Ne pas remplir</label>
                        <input
                            type="text"
                            id="contact-website"
                            name="website"
                            value={form.website}
                            onChange={handleChange}
                            tabIndex={-1}
                            autoComplete="off"
                        />
                    </div>

                    {status && <p className="contact__success" role="status" aria-live="polite">{status}</p>}
                    {error && <p className="contact__error" role="alert">{error}</p>}

                    <div className="contact__row">
                        <div className="contact__field">
                            <label htmlFor="contact-name"><User size={16} aria-hidden="true" /> Nom</label>
                            <input
                                id="contact-name"
                                type="text"
                                name="name"
                                autoComplete="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Votre nom"
                                required
                                aria-invalid={!!fieldErrors.name}
                                aria-describedby={fieldErrors.name ? "contact-name-error" : undefined}
                            />
                            {fieldErrors.name && <small id="contact-name-error" className="contact__field-error" role="alert">{fieldErrors.name}</small>}
                        </div>
                        <div className="contact__field">
                            <label htmlFor="contact-email"><Mail size={16} aria-hidden="true" /> Email</label>
                            <input
                                id="contact-email"
                                type="email"
                                name="email"
                                inputMode="email"
                                autoComplete="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="votre@email.fr"
                                required
                                aria-invalid={!!fieldErrors.email}
                                aria-describedby={fieldErrors.email ? "contact-email-error" : undefined}
                            />
                            {fieldErrors.email && <small id="contact-email-error" className="contact__field-error" role="alert">{fieldErrors.email}</small>}
                        </div>
                    </div>

                    <div className="contact__field">
                        <label htmlFor="contact-subject"><MessageSquare size={16} aria-hidden="true" /> Sujet</label>
                        <input
                            id="contact-subject"
                            type="text"
                            name="subject"
                            value={form.subject}
                            onChange={handleChange}
                            placeholder="Sujet de votre message"
                            required
                            aria-invalid={!!fieldErrors.subject}
                            aria-describedby={fieldErrors.subject ? "contact-subject-error" : undefined}
                        />
                        {fieldErrors.subject && <small id="contact-subject-error" className="contact__field-error" role="alert">{fieldErrors.subject}</small>}
                    </div>

                    <div className="contact__field">
                        <label htmlFor="contact-message">Message</label>
                        <textarea
                            id="contact-message"
                            name="message"
                            value={form.message}
                            onChange={handleChange}
                            placeholder="Votre message..."
                            rows={4}
                            required
                            aria-invalid={!!fieldErrors.message}
                            aria-describedby={fieldErrors.message ? "contact-message-error" : undefined}
                        />
                        {fieldErrors.message && <small id="contact-message-error" className="contact__field-error" role="alert">{fieldErrors.message}</small>}
                    </div>

                    <button type="submit" className="btn btn--primary btn--lg" disabled={submitting}>
                        <Send size={18} /> {submitting ? "Envoi en cours..." : "Envoyer"}
                    </button>
                </form>

                <div className="contact__info">
                    <h3>Informations</h3>
                    <div className="contact__info-item">
                        <Mail size={20} />
                        <div>
                            <strong>Email</strong>
                            <p>contact@glycibio.fr</p>
                        </div>
                    </div>
                    <div className="contact__info-item">
                        <MessageSquare size={20} />
                        <div>
                            <strong>Reponse</strong>
                            <p>Sous 24 a 48h ouvrables</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
