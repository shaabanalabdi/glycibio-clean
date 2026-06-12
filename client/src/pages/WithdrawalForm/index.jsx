import { Printer } from "lucide-react";
import { useDocumentMeta } from "@hooks/useDocumentMeta.js";

export const WithdrawalForm = () => {
    useDocumentMeta({
        title: "Formulaire de retractation | GlyciBio",
        description: "Formulaire officiel de retractation dans les 14 jours suivant la reception de votre commande.",
        canonical: "https://glycibio.fr/formulaire-retractation",
    });

    return (
        <section className="page legal-page withdrawal-form">
            <div className="legal-page__container">
                <div className="withdrawal-form__toolbar print-hide">
                    <button onClick={() => window.print()} className="btn btn--primary">
                        <Printer size={18} /> Imprimer ou enregistrer en PDF
                    </button>
                </div>

                <h1>Formulaire de retractation</h1>
                <p className="legal-page__updated">
                    Conforme au Code de la consommation, annexe a l'article L221-19
                </p>

                <section className="legal-page__section">
                    <p>
                        <em>
                            Veuillez completer et renvoyer le present formulaire uniquement si vous souhaitez
                            vous retracter du contrat. Le delai de retractation est de 14 jours a compter de la
                            reception de votre commande.
                        </em>
                    </p>

                    <p>
                        <strong>A l'attention de :</strong><br />
                        GlyciBio SAS<br />
                        Service Clientele<br />
                        12 rue des Jardins Bio<br />
                        75011 Paris, France<br />
                        Email : <a href="mailto:contact@glycibio.fr">contact@glycibio.fr</a>
                    </p>

                    <p>
                        Je / Nous (*) vous notifie / notifions (*) par la presente ma / notre (*) retractation
                        du contrat portant sur la vente du bien (*) / pour la prestation de services (*)
                        ci-dessous :
                    </p>

                    <div className="withdrawal-form__fields">
                        <div><strong>Numero de commande :</strong> _____________________________</div>
                        <div><strong>Commande passee le :</strong> _____________________________</div>
                        <div><strong>Recue le :</strong> _____________________________</div>
                        <div><strong>Nom du consommateur :</strong> _____________________________</div>
                        <div><strong>Adresse du consommateur :</strong> _____________________________</div>
                        <div>_____________________________________________________________________</div>
                        <div><strong>Signature</strong> (uniquement en cas de notification papier) :</div>
                        <div className="withdrawal-form__signature-space" aria-hidden="true" />
                        <div><strong>Date :</strong> _____________________________</div>
                    </div>

                    <p className="withdrawal-form__footnote">
                        (*) Rayer la mention inutile.
                    </p>
                </section>

                <section className="legal-page__section print-hide">
                    <h2>Comment proceder ?</h2>
                    <ol>
                        <li>Imprimez ce formulaire (bouton en haut de page) ou enregistrez-le en PDF</li>
                        <li>Remplissez les informations demandees</li>
                        <li>Envoyez-le par email a <a href="mailto:contact@glycibio.fr">contact@glycibio.fr</a> ou par courrier postal a l'adresse indiquee</li>
                        <li>Renvoyez les produits dans leur emballage d'origine sous 14 jours apres notification</li>
                    </ol>
                    <p>
                        Le remboursement sera effectue sous 14 jours apres reception du retour, sur le moyen
                        de paiement initial. Les frais de retour restent a votre charge sauf en cas de produit
                        defectueux ou non conforme.
                    </p>
                </section>
            </div>
        </section>
    );
};
