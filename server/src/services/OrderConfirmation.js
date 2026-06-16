import {orderRepository} from "../repository/OrderRepository.js";
import {userRepository} from "../repository/UserRepository.js";
import {EmailService} from "./EmailService.js";
import {Logger} from "./Logger.js";

// Envoi IDEMPOTENT de l'email de confirmation de commande, DECOUPLE du marquage
// 'payee'. Plusieurs chemins peuvent l'appeler en parallele (webhook Stripe ET
// retour /payments/success) : un seul "gagne" le verrou (claimConfirmationEmail,
// UPDATE atomique) et envoie donc l'email -> pas de doublon.
//
// Sur echec d'ENVOI (panne SMTP transitoire), le verrou est libere et l'erreur
// propagee : le webhook Stripe renverra l'evenement (le controleur repond 500),
// une nouvelle tentative re-posera le verrou et renverra l'email -> aucune perte.
//
// Sur echec PERMANENT (commande/utilisateur introuvable), le verrou reste pose
// et on ne propage PAS d'erreur : inutile de declencher des retries Stripe sans fin.
//
// Retour : true si un email a ete envoye, false sinon (deja envoye / pas de SMTP /
// donnees absentes). Throw uniquement sur echec d'envoi retentable.
export const sendOrderConfirmationOnce = async (orderId) => {
    // Pas de SMTP (dev) : rien a envoyer, on ne pose meme pas le verrou.
    if (!EmailService.isConfigured()) return false

    // Garantit la presence de la colonne confirmation_email_sent sur les BDD
    // existantes (memoise : ne tourne qu'une fois).
    await orderRepository.ensureColumns()

    const claimed = await orderRepository.claimConfirmationEmail(orderId)
    if (!claimed) return false // deja envoye, ou commande pas (encore) 'payee'

    const order = await orderRepository.find(orderId)
    const user = order ? await userRepository.find(order.user_id) : null

    if (!user) {
        // Cas permanent : on garde le verrou pose pour eviter une boucle de retry.
        Logger.warn(`[OrderConfirmation] Commande/utilisateur introuvable pour #${orderId} - email ignore`)
        return false
    }

    const ok = await EmailService.sendOrderConfirmation(user.email, order)
    if (!ok) {
        // Echec transitoire : on libere le verrou pour permettre une nouvelle tentative.
        await orderRepository.releaseConfirmationEmail(orderId)
        throw new Error(`Echec envoi email de confirmation pour la commande #${orderId}`)
    }

    return true
}
