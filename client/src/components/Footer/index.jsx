import "./style.scss"
import { Link } from "react-router-dom";

const openCookiePreferences = (e) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("open-cookie-preferences"));
};

export const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer__container">
                <div className="footer__brand">
                    <h3>GlyciBio</h3>
                    <p>Aliments a index glycemique controle</p>
                    <p className="footer__mediator">
                        Mediateur de la consommation : SAS Mediation Solution -{" "}
                        <a href="https://www.sasmediationsolution-conso.fr/" target="_blank" rel="noopener noreferrer">
                            sasmediationsolution-conso.fr
                        </a>
                    </p>
                </div>

                <div className="footer__column">
                    <h4>Boutique</h4>
                    <Link to="/catalogue">Catalogue</Link>
                    <Link to="/a-propos">A propos</Link>
                    <Link to="/contact">Contact</Link>
                </div>

                <div className="footer__column">
                    <h4>Informations legales</h4>
                    <Link to="/mentions-legales">Mentions legales</Link>
                    <Link to="/cgv">CGV</Link>
                    <Link to="/politique-confidentialite">Politique de confidentialite</Link>
                    <Link to="/cookies">Politique cookies</Link>
                    <Link to="/formulaire-retractation">Formulaire de retractation</Link>
                    <a href="#" onClick={openCookiePreferences}>Gerer les cookies</a>
                </div>

                <div className="footer__copy">
                    <p>&copy; 2026 GlyciBio - Tous droits reserves</p>
                </div>
            </div>
        </footer>
    );
};
