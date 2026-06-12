import nodemailer from "nodemailer";
import {Logger} from "./Logger.js";

// Echappe les caracteres HTML : empeche l'injection (XSS) de donnees fournies
// par l'utilisateur lorsqu'elles sont interpolees dans le corps des emails.
const escapeHtml = (value) =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")

const createTransporter = () => {
    const host = process.env.SMTP_HOST
    const port = parseInt(process.env.SMTP_PORT || "587", 10)
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS

    if (!host || !user || !pass) {
        return null
    }

    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        // En production on EXIGE un certificat TLS valide. Hors production
        // (dev / SMTP local auto-signe), on tolere un certificat non verifie.
        ...(process.env.NODE_ENV !== "production" && {
            tls: { rejectUnauthorized: false }
        })
    })
}

export class EmailService {

    static sendEmail = async ({ to, subject, html, text }) => {
        const transporter = createTransporter()

        if (!transporter) {
            Logger.warn("[EmailService] SMTP non configure (SMTP_HOST, SMTP_USER, SMTP_PASS manquants)")
            Logger.warn(`  To: ${to} | Subject: ${subject}`)
            return false
        }

        try
        {
            const info = await transporter.sendMail({
                from: `"GlyciBio" <${process.env.SMTP_USER}>`,
                to,
                subject,
                html,
                text: text || html.replace(/<[^>]+>/g, "")
            })
            Logger.info(`[EmailService] Email envoye : ${info.messageId}`)
            return true
        }
        catch (error)
        {
            Logger.error("[EmailService] Erreur envoi:", { msg: error.message })
            return false
        }
    }

    static sendOrderConfirmation = async (userEmail, order) => {
        const subject = `GlyciBio — Confirmation de votre commande #${order.id}`
        const clientUrl = process.env.CLIENT_URL || "http://localhost:5173"
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2d6a4f;">Votre commande est confirmee !</h1>
            <p>Bonjour,</p>
            <p>Nous avons bien recu votre commande <strong>#${order.id}</strong>.</p>
            <table style="width:100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="background: #f4f4f4;">
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Total</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${parseFloat(order.total).toFixed(2)} &euro;</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Adresse de livraison</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(order.shipping_address)}</td>
              </tr>
              <tr style="background: #f4f4f4;">
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Statut</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">En attente de paiement</td>
              </tr>
            </table>
            <p>Vous pouvez suivre votre commande dans <a href="${clientUrl}/profil">votre espace client</a>.</p>
            <p style="color: #666; font-size: 12px;">L'equipe GlyciBio</p>
          </div>
        `
        return this.sendEmail({ to: userEmail, subject, html })
    }

    static sendPasswordResetEmail = async (userEmail, resetToken) => {
        const clientUrl = process.env.CLIENT_URL || "http://localhost:5173"
        const resetUrl = `${clientUrl}/reinitialiser-mdp?token=${resetToken}`
        const subject = "GlyciBio — Reinitialisation de votre mot de passe"
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2d6a4f;">Reinitialisation du mot de passe</h1>
            <p>Vous avez demande la reinitialisation de votre mot de passe GlyciBio.</p>
            <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
            <a href="${resetUrl}" style="display:inline-block; background:#2d6a4f; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none; margin: 20px 0;">
              Reinitialiser mon mot de passe
            </a>
            <p style="color:#666; font-size:12px;">Ce lien est valable pendant 1 heure. Si vous n'etes pas a l'origine de cette demande, ignorez cet email.</p>
            <p style="color: #666; font-size: 12px;">L'equipe GlyciBio</p>
          </div>
        `
        return this.sendEmail({ to: userEmail, subject, html })
    }

    static sendAbandonedCartEmail = async (userEmail, items) => {
        const lines = items.map((i) => `<li>${escapeHtml(i.name)} x${i.quantity} - ${parseFloat(i.subtotal).toFixed(2)} EUR</li>`).join("")
        const baseUrl = process.env.PUBLIC_BASE_URL || "https://glycibio.fr"
        return this.sendEmail({
            to: userEmail,
            subject: "Vous avez oublie quelque chose chez GlyciBio",
            html: `
              <h2>Votre panier vous attend !</h2>
              <p>Vous avez laisse les produits suivants dans votre panier :</p>
              <ul>${lines}</ul>
              <p style="margin-top:24px">
                <a href="${baseUrl}/panier" style="background:#2e7d32;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
                  Finaliser ma commande
                </a>
              </p>
              <p style="font-size:12px;color:#888;margin-top:32px">
                Si vous ne souhaitez plus recevoir ces rappels, vous pouvez vous desinscrire depuis votre profil.
              </p>
            `
        })
    }
}
