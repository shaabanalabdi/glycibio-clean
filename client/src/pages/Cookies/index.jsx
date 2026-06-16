import { useDocumentMeta } from "@hooks/useDocumentMeta.js";

const openPreferences = () => {
    // Re-ouvre la banniere de consentement
    window.dispatchEvent(new CustomEvent("open-cookie-preferences"));
};

export const Cookies = () => {
    useDocumentMeta({
        title: "Politique cookies | GlyciBio",
        description: "Liste des cookies utilises sur le site GlyciBio et leur finalite, conformement aux recommandations CNIL.",
        canonical: "https://glycibio.fr/cookies",
    });

    return (
        <section className="page legal-page">
            <div className="legal-page__container">
                <h1>Politique cookies</h1>
                <p className="legal-page__updated">Derniere mise a jour : mai 2026</p>

                <section className="legal-page__section">
                    <h2>1. Qu'est-ce qu'un cookie ?</h2>
                    <p>
                        Un cookie est un petit fichier texte depose sur votre appareil lors de la visite d'un site
                        web. Les cookies permettent de memoriser des informations relatives a votre navigation et
                        d'ameliorer votre experience.
                    </p>
                </section>

                <section className="legal-page__section">
                    <h2>2. Cookies utilises par GlyciBio</h2>

                    <h3>Cookies strictement necessaires (sans consentement)</h3>
                    <table className="legal-table">
                        <thead><tr><th>Nom</th><th>Type</th><th>Finalite</th><th>Duree</th><th>Editeur</th></tr></thead>
                        <tbody>
                            <tr><td><code>token</code></td><td>Cookie (HttpOnly)</td><td>Maintenir la session connectee (jeton JWT, inaccessible au JavaScript)</td><td>24h</td><td>GlyciBio</td></tr>
                            <tr><td><code>csrf_token</code></td><td>Cookie</td><td>Protection contre la falsification de requete (CSRF)</td><td>Session</td><td>GlyciBio</td></tr>
                            <tr><td><code>glycibio_consent</code></td><td>Stockage local</td><td>Memoriser votre choix concernant les cookies</td><td>13 mois</td><td>GlyciBio</td></tr>
                            <tr><td><code>glycibio-guest-cart</code></td><td>Stockage local</td><td>Conserver le panier avant connexion</td><td>Persistant</td><td>GlyciBio</td></tr>
                            <tr><td><code>glycibio-theme</code></td><td>Stockage local</td><td>Memoriser le theme clair / sombre choisi</td><td>Persistant</td><td>GlyciBio</td></tr>
                        </tbody>
                    </table>
                    <p className="legal-page__note">
                        <em>
                            Le cookie de session <code>token</code> est <strong>HttpOnly</strong> : il n&apos;est jamais
                            accessible au JavaScript de la page, ce qui le protege contre le vol par injection de script
                            (XSS). Les elements de &laquo;&nbsp;stockage local&nbsp;&raquo; (localStorage) ne sont pas
                            des cookies et ne sont jamais transmis a nos serveurs ; ils restent sur votre appareil.
                        </em>
                    </p>

                    <h3>Cookies soumis a consentement</h3>
                    <p>
                        <em>
                            GlyciBio n'utilise actuellement aucun cookie de mesure d'audience, de marketing ou de
                            reseaux sociaux. Cette section sera mise a jour si de nouveaux cookies sont ajoutes.
                        </em>
                    </p>
                </section>

                <section className="legal-page__section">
                    <h2>3. Gerer vos preferences</h2>
                    <p>
                        Vous pouvez a tout moment modifier vos preferences en cliquant ci-dessous, ou via le lien
                        "Gerer les cookies" present en bas de page.
                    </p>
                    <p>
                        <button onClick={openPreferences} className="btn btn--outline">
                            Gerer mes preferences cookies
                        </button>
                    </p>
                    <p>
                        Vous pouvez egalement configurer votre navigateur pour refuser les cookies tiers :
                    </p>
                    <ul>
                        <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Chrome</a></li>
                        <li><a href="https://support.mozilla.org/fr/kb/protection-renforcee-contre-pistage-firefox-ordinateur" target="_blank" rel="noopener noreferrer">Firefox</a></li>
                        <li><a href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
                        <li><a href="https://support.microsoft.com/fr-fr/microsoft-edge" target="_blank" rel="noopener noreferrer">Edge</a></li>
                    </ul>
                </section>

                <section className="legal-page__section">
                    <h2>4. Reference reglementaire</h2>
                    <p>
                        Cette politique est conforme aux recommandations de la CNIL relatives a l'usage des
                        cookies et autres traceurs (deliberation 2020-091 du 17 septembre 2020).
                    </p>
                </section>
            </div>
        </section>
    );
};
