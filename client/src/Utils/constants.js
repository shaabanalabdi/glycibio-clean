// ============================================================
// Regles metier cote client — SOURCE UNIQUE DE VERITE.
// Evite les nombres magiques dupliques (le seuil "49" etait code en dur dans
// Cart ET en chaine "49" dans le bandeau Navbar -> incoherence possible).
// ============================================================
export const FREE_SHIPPING_THRESHOLD = 50 // EUR : sous-total minimum pour la livraison gratuite (= methode "Gratuit (+50 EUR)" ; doit rester aligne avec le serveur OrderPricing.FREE_SHIPPING_THRESHOLD)
export const VAT_RATE = 0.20              // TVA 20% (prix affiches TTC)
