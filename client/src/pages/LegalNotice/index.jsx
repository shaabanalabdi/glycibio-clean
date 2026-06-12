import { useDocumentMeta } from "@hooks/useDocumentMeta.js";

export const LegalNotice = () => {
    useDocumentMeta({
        title: "Mentions legales | GlyciBio",
        description: "Mentions legales de GlyciBio SAS : editeur, hebergeur, propriete intellectuelle, RGPD.",
        canonical: "https://glycibio.fr/mentions-legales",
    });

    return (
        <section className="page legal-page">
            <div className="legal-page__container">
                <h1>Mentions legales</h1>
                <p className="legal-page__updated">Derniere mise a jour : mai 2026</p>

                <section className="legal-page__section">
                    <h2>1. Editeur du site</h2>
                    <p>
                        Le site <strong>GlyciBio</strong> est edite par :<br />
                        <strong>GlyciBio SAS</strong><br />
                        Forme juridique : Societe par actions simplifiee<br />
                        Capital social : 10 000 &euro;<br />
                        Adresse : 12 rue des Jardins Bio, 75011 Paris, France<br />
                        Telephone : +33 (0)1 23 45 67 89<br />
                        Email : contact@glycibio.fr<br />
                        SIRET : 123 456 789 00012<br />
                        RCS Paris : 123 456 789<br />
                        TVA intracommunautaire : FR12 123456789
                    </p>
                </section>

                <section className="legal-page__section">
                    <h2>2. Directeur de la publication</h2>
                    <p>
                        Le directeur de la publication est le representant legal de GlyciBio SAS.
                    </p>
                </section>

                <section className="legal-page__section">
                    <h2>3. Hebergeur</h2>
                    <p>
                        Ce site est heberge par :<br />
                        <strong>OVH Cloud</strong><br />
                        2 rue Kellermann, 59100 Roubaix, France<br />
                        Telephone : +33 (0)9 72 10 10 07<br />
                        Site web : <a href="https://www.ovh.com" target="_blank" rel="noopener noreferrer">www.ovh.com</a>
                    </p>
                </section>

                <section className="legal-page__section">
                    <h2>4. Propriete intellectuelle</h2>
                    <p>
                        L'ensemble des contenus presentes sur le site GlyciBio (textes, images, logos, icones,
                        structure du site) est la propriete exclusive de GlyciBio SAS ou de ses partenaires,
                        et est protege par les lois francaises et internationales relatives a la propriete intellectuelle.
                    </p>
                    <p>
                        Toute reproduction, representation, modification, publication ou adaptation de tout ou
                        partie des elements du site, quel que soit le moyen ou le procede utilise, est interdite
                        sans l'autorisation prealable et ecrite de GlyciBio SAS.
                    </p>
                </section>

                <section className="legal-page__section">
                    <h2>5. Donnees personnelles (RGPD)</h2>
                    <p>
                        Conformement au Reglement General sur la Protection des Donnees (RGPD) et a la loi
                        Informatique et Libertes, vous disposez d'un droit d'acces, de rectification,
                        d'effacement, de limitation et de portabilite de vos donnees personnelles.
                    </p>
                    <p>
                        Les donnees collectees lors de votre inscription (nom, prenom, adresse email, adresse
                        postale) sont utilisees exclusivement pour le traitement de vos commandes et la gestion
                        de votre compte client. Elles ne sont pas cedees a des tiers.
                    </p>
                    <p>
                        Pour exercer vos droits, contactez notre DPO a l'adresse :{" "}
                        <a href="mailto:dpo@glycibio.fr">dpo@glycibio.fr</a>
                    </p>
                    <p>
                        Vous avez egalement le droit d'introduire une reclamation aupres de la CNIL :{" "}
                        <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>
                    </p>
                </section>

                <section className="legal-page__section">
                    <h2>6. Cookies</h2>
                    <p>
                        Le site GlyciBio utilise uniquement des cookies techniques strictement necessaires
                        au fonctionnement du service (authentification, panier). Aucun cookie de suivi
                        publicitaire ou analytique tiers n'est utilise sans votre consentement explicite.
                    </p>
                </section>

                <section className="legal-page__section">
                    <h2>7. Limitation de responsabilite</h2>
                    <p>
                        GlyciBio SAS s'efforce de maintenir les informations de ce site a jour et exactes,
                        mais ne peut garantir leur exhaustivite ni leur exactitude. GlyciBio SAS ne saurait
                        etre tenu responsable de tout dommage direct ou indirect resultant de l'utilisation
                        de ce site.
                    </p>
                </section>

                <section className="legal-page__section">
                    <h2>8. Droit applicable</h2>
                    <p>
                        Les presentes mentions legales sont regies par le droit francais. En cas de litige,
                        les tribunaux francais seront seuls competents.
                    </p>
                </section>
            </div>
        </section>
    );
};
