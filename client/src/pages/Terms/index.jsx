import { useDocumentMeta } from "@hooks/useDocumentMeta.js";

export const Terms = () => {
    useDocumentMeta({
        title: "Conditions Generales de Vente | GlyciBio",
        description: "Conditions Generales de Vente de GlyciBio : commande, paiement, livraison, droit de retractation, garanties.",
        canonical: "https://glycibio.fr/cgv",
    });

    return (
        <section className="page legal-page">
            <div className="legal-page__container">
                <h1>Conditions generales de vente</h1>
                <p className="legal-page__updated">Derniere mise a jour : mai 2026</p>

                <section className="legal-page__section">
                    <h2>Article 1 — Objet et champ d'application</h2>
                    <p>
                        Les presentes Conditions Generales de Vente (CGV) regissent les relations contractuelles
                        entre la societe <strong>GlyciBio SAS</strong> (ci-apres "le Vendeur") et toute personne
                        physique majeure effectuant un achat via le site <strong>glycibio.fr</strong>
                        (ci-apres "l'Acheteur").
                    </p>
                    <p>
                        Tout achat implique l'acceptation pleine et entiere des presentes CGV par l'Acheteur,
                        qui renonce a se prevaloir de tout document contradictoire.
                    </p>
                </section>

                <section className="legal-page__section">
                    <h2>Article 2 — Produits</h2>
                    <p>
                        Les produits proposes a la vente sont des aliments a index glycemique bas ou modere,
                        des alternatives naturelles au sucre et des produits de nutrition sante. Leurs
                        caracteristiques essentielles (description, composition, allergenes, valeurs
                        nutritionnelles, index glycemique) sont precises sur chaque fiche produit.
                    </p>
                    <p>
                        Le Vendeur se reserve le droit de modifier a tout moment son catalogue, notamment
                        en cas de rupture de stock ou d'arret de commercialisation d'un produit.
                    </p>
                </section>

                <section className="legal-page__section">
                    <h2>Article 3 — Prix</h2>
                    <p>
                        Les prix sont affiches en euros TTC (toutes taxes comprises). Les frais de livraison
                        sont calcules et affiches lors du processus de commande, avant validation definitive.
                    </p>
                    <p>
                        Le Vendeur se reserve le droit de modifier ses prix a tout moment. Les produits seront
                        factures sur la base des tarifs en vigueur au moment de la validation de la commande.
                    </p>
                </section>

                <section className="legal-page__section">
                    <h2>Article 4 — Commande</h2>
                    <p>La commande se deroule en plusieurs etapes :</p>
                    <ol>
                        <li>Selection des produits et ajout au panier</li>
                        <li>Verification du recapitulatif du panier</li>
                        <li>Connexion ou creation de compte client</li>
                        <li>Saisie de l'adresse de livraison</li>
                        <li>Choix du mode de livraison</li>
                        <li>Validation et paiement securise</li>
                        <li>Confirmation de commande par email</li>
                    </ol>
                    <p>
                        La vente n'est definitivement conclue qu'apres validation du paiement et envoi d'un
                        email de confirmation de commande a l'Acheteur.
                    </p>
                </section>

                <section className="legal-page__section">
                    <h2>Article 5 — Paiement</h2>
                    <p>
                        Le paiement s'effectue en ligne par carte bancaire (Visa, Mastercard) via la
                        plateforme securisee <strong>Stripe</strong>. Les donnees bancaires sont chiffrees
                        et ne sont jamais stockees sur nos serveurs.
                    </p>
                    <p>
                        En cas d'impayé ou de fraude, GlyciBio SAS se reserve le droit d'annuler la commande
                        et d'engager les poursuites judiciaires appropriees.
                    </p>
                </section>

                <section className="legal-page__section">
                    <h2>Article 6 — Livraison</h2>
                    <p>
                        Les commandes sont preparees et envoyees dans un delai de 2 a 5 jours ouvrables.
                        Les delais de livraison indiques sont donnes a titre indicatif et peuvent varier
                        en fonction des transporteurs.
                    </p>
                    <p>
                        En cas de produits manquants ou endommages lors de la livraison, l'Acheteur doit
                        signaler le probleme a GlyciBio SAS dans les 3 jours suivant la reception.
                    </p>
                </section>

                <section className="legal-page__section">
                    <h2>Article 7 — Droit de retractation</h2>
                    <p>
                        Conformement a l'article L.221-18 du Code de la consommation, l'Acheteur dispose
                        d'un delai de <strong>14 jours calendaires</strong> a compter de la reception de sa
                        commande pour exercer son droit de retractation, sans justification.
                    </p>
                    <p>
                        <strong>Exception :</strong> ce droit ne s'applique pas aux denrees alimentaires
                        perimsables ou dont la date limite de consommation est inferieure a 14 jours
                        (art. L.221-28 du Code de la consommation).
                    </p>
                    <p>
                        Pour exercer ce droit, l'Acheteur doit contacter GlyciBio SAS a l'adresse
                        <a href="mailto:retours@glycibio.fr">retours@glycibio.fr</a> avant l'expiration
                        du delai. Les frais de retour sont a la charge de l'Acheteur.
                    </p>
                </section>

                <section className="legal-page__section">
                    <h2>Article 8 — Garanties</h2>
                    <p>
                        Tous nos produits beneficient de la garantie legale de conformite (articles
                        L.217-4 et suivants du Code de la consommation) et de la garantie contre les vices
                        caches (articles 1641 et suivants du Code civil).
                    </p>
                </section>

                <section className="legal-page__section">
                    <h2>Article 9 — Responsabilite</h2>
                    <p>
                        GlyciBio SAS ne saurait etre responsable des dommages de toute nature, directs ou
                        indirects, resultant de l'utilisation non appropriee des produits. Les informations
                        nutritionnelles sont fournies a titre indicatif et ne constituent pas un avis medical.
                    </p>
                </section>

                <section className="legal-page__section">
                    <h2>Article 10 — Donnees personnelles</h2>
                    <p>
                        Les donnees collectees sont necessaires au traitement des commandes et sont traitees
                        conformement a notre politique de confidentialite et au RGPD. Pour toute question,
                        contactez : <a href="mailto:dpo@glycibio.fr">dpo@glycibio.fr</a>
                    </p>
                </section>

                <section className="legal-page__section">
                    <h2>Article 11 — Service client et litiges</h2>
                    <p>
                        Service client : <a href="mailto:contact@glycibio.fr">contact@glycibio.fr</a><br />
                        Telephone : +33 (0)1 23 45 67 89 (du lundi au vendredi, 9h-18h)
                    </p>
                    <p>
                        Conformement a l'ordonnance n°2015-1033 du 20 aout 2015, tout litige decoulant
                        d'un achat effectue sur notre site peut faire l'objet d'un reglement amiable
                        par la mediation. Plateforme europeenne de reglement en ligne des litiges :{" "}
                        <a href="https://ec.europa.eu/odr" target="_blank" rel="noopener noreferrer">
                            ec.europa.eu/odr
                        </a>
                    </p>
                </section>

                <section className="legal-page__section">
                    <h2>Article 12 — Droit applicable</h2>
                    <p>
                        Les presentes CGV sont soumises au droit francais. En cas de litige, les tribunaux
                        francais seront seuls competents.
                    </p>
                </section>
            </div>
        </section>
    );
};
