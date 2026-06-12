import { useDocumentMeta } from "@hooks/useDocumentMeta.js";

export const PrivacyPolicy = () => {
    useDocumentMeta({
        title: "Politique de confidentialite | GlyciBio",
        description: "Informations sur la collecte et le traitement de vos donnees personnelles par GlyciBio, conformement au RGPD.",
        canonical: "https://glycibio.fr/politique-confidentialite",
    });

    return (
        <section className="page legal-page">
            <div className="legal-page__container">
                <h1>Politique de confidentialite</h1>
                <p className="legal-page__updated">Derniere mise a jour : mai 2026</p>

                <section className="legal-page__section">
                    <h2>1. Responsable du traitement</h2>
                    <p>
                        Le responsable du traitement des donnees a caractere personnel est :<br />
                        <strong>GlyciBio SAS</strong><br />
                        12 rue des Jardins Bio, 75011 Paris, France<br />
                        Email : <a href="mailto:contact@glycibio.fr">contact@glycibio.fr</a><br />
                        Telephone : +33 (0)1 23 45 67 89
                    </p>
                    <p>
                        Pour toute question relative a la protection de vos donnees, vous pouvez nous contacter
                        par email a l'adresse <a href="mailto:dpo@glycibio.fr">dpo@glycibio.fr</a>.
                    </p>
                </section>

                <section className="legal-page__section">
                    <h2>2. Donnees collectees</h2>
                    <p>Dans le cadre de votre utilisation du site, nous collectons les donnees suivantes :</p>
                    <ul>
                        <li><strong>Identite</strong> : prenom, nom, civilite</li>
                        <li><strong>Coordonnees</strong> : email, telephone, adresse postale</li>
                        <li><strong>Authentification</strong> : email + mot de passe (hashe avec bcrypt cout 12)</li>
                        <li><strong>Commandes</strong> : historique d'achats, montants, modes de livraison</li>
                        <li><strong>Donnees techniques</strong> : adresse IP, navigateur, journaux serveur (logs)</li>
                        <li><strong>Paiement</strong> : traite par notre prestataire Stripe (PCI-DSS niveau 1) - GlyciBio ne stocke aucune donnee bancaire</li>
                    </ul>
                </section>

                <section className="legal-page__section">
                    <h2>3. Finalites et bases legales</h2>
                    <table className="legal-table">
                        <thead>
                            <tr><th>Finalite</th><th>Base legale (RGPD)</th><th>Duree de conservation</th></tr>
                        </thead>
                        <tbody>
                            <tr><td>Creation et gestion de compte</td><td>Execution du contrat (art. 6.1.b)</td><td>Jusqu'a suppression du compte + 3 ans</td></tr>
                            <tr><td>Traitement des commandes</td><td>Execution du contrat (art. 6.1.b)</td><td>10 ans (obligation comptable)</td></tr>
                            <tr><td>Service client / SAV</td><td>Interet legitime (art. 6.1.f)</td><td>5 ans apres derniere interaction</td></tr>
                            <tr><td>Newsletter (si inscrit)</td><td>Consentement (art. 6.1.a)</td><td>Jusqu'au retrait du consentement</td></tr>
                            <tr><td>Cookies analytiques</td><td>Consentement (art. 6.1.a)</td><td>13 mois max (recommandation CNIL)</td></tr>
                            <tr><td>Securite et lutte anti-fraude</td><td>Interet legitime (art. 6.1.f)</td><td>1 an</td></tr>
                        </tbody>
                    </table>
                </section>

                <section className="legal-page__section">
                    <h2>4. Destinataires des donnees</h2>
                    <p>Vos donnees sont accessibles uniquement aux personnes habilitees au sein de GlyciBio et a nos sous-traitants suivants :</p>
                    <ul>
                        <li><strong>Stripe (Stripe Inc., USA + Irlande)</strong> - traitement des paiements, transfert encadre par clauses contractuelles types (CCT)</li>
                        <li><strong>OVH Cloud (France)</strong> - hebergement du site et de la base de donnees</li>
                        <li><strong>Nodemailer / prestataire SMTP</strong> - envoi des emails transactionnels (confirmation, reset mot de passe)</li>
                    </ul>
                    <p>Aucune donnee n'est revendue ou cedee a des tiers a des fins commerciales.</p>
                </section>

                <section className="legal-page__section">
                    <h2>5. Vos droits (RGPD art. 15 a 22)</h2>
                    <p>Conformement au Reglement General sur la Protection des Donnees, vous disposez des droits suivants :</p>
                    <ul>
                        <li><strong>Droit d'acces</strong> - obtenir une copie de vos donnees sur demande a <a href="mailto:dpo@glycibio.fr">dpo@glycibio.fr</a> (delai legal : 1 mois)</li>
                        <li><strong>Droit de rectification</strong> - modifier vos informations dans votre profil</li>
                        <li><strong>Droit a l'effacement</strong> - supprimer votre compte (sauf donnees soumises a obligation comptable)</li>
                        <li><strong>Droit a la limitation du traitement</strong></li>
                        <li><strong>Droit d'opposition</strong> au traitement</li>
                        <li><strong>Droit a la portabilite</strong> - recevoir vos donnees dans un format structure (JSON)</li>
                        <li><strong>Droit de retirer votre consentement</strong> a tout moment (cookies, newsletter)</li>
                    </ul>
                    <p>
                        Pour exercer ces droits, contactez <a href="mailto:dpo@glycibio.fr">dpo@glycibio.fr</a>.
                        Nous repondons dans un delai maximum d'un mois.
                    </p>
                    <p>
                        Si vous estimez que vos droits ne sont pas respectes, vous pouvez introduire une reclamation
                        aupres de la <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener noreferrer">CNIL</a>.
                    </p>
                </section>

                <section className="legal-page__section">
                    <h2>6. Securite</h2>
                    <p>
                        GlyciBio met en oeuvre des mesures techniques et organisationnelles appropriees pour
                        proteger vos donnees : connexion HTTPS, hashage des mots de passe (bcrypt cout 12),
                        limitation des tentatives de connexion, journalisation, mises a jour de securite regulieres.
                    </p>
                </section>

                <section className="legal-page__section">
                    <h2>7. Cookies</h2>
                    <p>
                        L'utilisation des cookies est detaillee dans notre <a href="/cookies">politique cookies</a>.
                        Vous pouvez modifier vos preferences a tout moment via le lien "Gerer les cookies" en
                        bas de page.
                    </p>
                </section>
            </div>
        </section>
    );
};
