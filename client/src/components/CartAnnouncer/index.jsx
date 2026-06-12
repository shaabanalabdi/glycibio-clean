import { useEffect, useRef, useState } from "react";
import { useCart } from "@hooks/useCart.js";

// Region aria-live qui annonce les changements du panier aux lecteurs d'ecran.
// Visuellement cache (.sr-only), mais lue par NVDA / VoiceOver / TalkBack.
// On utilise aria-live="polite" : pas d'interruption de la lecture en cours.
export const CartAnnouncer = () => {
    const { cartCount } = useCart();
    const [message, setMessage] = useState("");
    const previousRef = useRef(cartCount);
    const timerRef = useRef(null);

    // Reagit au CHANGEMENT de cartCount pour annoncer la mise a jour.
    // Pattern "derivation depuis une prop externe" - pas de cascading render.
    /* eslint-disable react-hooks/set-state-in-effect -- annonce derivee du changement externe cartCount (sync external -> internal) */
    useEffect(() => {
        const previous = previousRef.current;
        if (cartCount === previous) return;
        previousRef.current = cartCount;

        if (cartCount === 0) {
            setMessage("Panier vide");
        } else {
            const plural = cartCount > 1 ? "s" : "";
            const diff = cartCount - previous;
            if (diff > 0) {
                setMessage(`Ajoute au panier. ${cartCount} article${plural} au total.`);
            } else if (diff < 0) {
                setMessage(`Article retire. ${cartCount} article${plural} au total.`);
            } else {
                setMessage(`${cartCount} article${plural} dans le panier.`);
            }
        }

        // Nettoie le message apres 2.5s pour que la prochaine modification
        // identique soit ré-annoncee (sinon le lecteur d'ecran ignore le doublon).
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setMessage(""), 2500);
        return () => clearTimeout(timerRef.current);
    }, [cartCount]);
    /* eslint-enable react-hooks/set-state-in-effect */

    return (
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {message}
        </div>
    );
};
