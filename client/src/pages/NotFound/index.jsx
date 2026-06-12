import { Link } from "react-router-dom";

export const NotFound = () => {
    return (
        <div className="not-found">
            <h1>404</h1>
            <p>Page non trouvee</p>
            <Link to="/" className="btn btn--primary">Retour a l'accueil</Link>
        </div>
    );
};
