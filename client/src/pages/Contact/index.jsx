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
    const [sendMessage, { isLoading: submitting }] = useSendMessageMutation()

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (submitting) return // evite la double-soumission (double-clic / connexion lente)
        setStatus("")
        setError("")

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

                    {status && <p className="contact__success">{status}</p>}
                    {error && <p className="contact__error">{error}</p>}

                    <div className="contact__row">
                        <div className="contact__field">
                            <label><User size={16} /> Nom</label>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Votre nom"
                                required
                            />
                        </div>
                        <div className="contact__field">
                            <label><Mail size={16} /> Email</label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="votre@email.fr"
                                required
                            />
                        </div>
                    </div>

                    <div className="contact__field">
                        <label><MessageSquare size={16} /> Sujet</label>
                        <input
                            type="text"
                            name="subject"
                            value={form.subject}
                            onChange={handleChange}
                            placeholder="Sujet de votre message"
                            required
                        />
                    </div>

                    <div className="contact__field">
                        <label>Message</label>
                        <textarea
                            name="message"
                            value={form.message}
                            onChange={handleChange}
                            placeholder="Votre message..."
                            rows={6}
                            required
                        />
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
