import { Link } from "react-router-dom";
import { useDocumentMeta } from "@hooks/useDocumentMeta.js";

export const NotFound = () => {
    // 404 : on demande explicitement aux moteurs de NE PAS indexer cette page
    // (evite les "soft 404" indexes en heritant des meta de la page d'accueil).
    useDocumentMeta({
        title: "Page introuvable (404) | GlyciBio",
        description: "La page demandee n'existe pas ou a ete deplacee.",
        noIndex: true
    });

    return (
        <div className="not-found">
            <h1>404</h1>
            <p>Page non trouvee</p>
            <Link to="/" className="btn btn--primary">Retour a l'accueil</Link>
        </div>
    );
};
