// Formatage des prix en euros au format francais (separateur fin
// d'espace insecable + virgule decimale + symbole euro apres).
// Exemple : 1234.5  ->  "1 234,50 €"
//
// Utilise Intl.NumberFormat (locale-aware, sans dependance).
// Memorise l'instance pour eviter de la recreer a chaque appel.

const formatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatPrice = (value) => {
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (!Number.isFinite(num)) return formatter.format(0);
  return formatter.format(num);
};

// Variante sans le symbole EUR (utile dans les recapitulatifs ou le
// libelle "Total" est deja affiche separement).
export const formatPriceNumber = (value) => {
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (!Number.isFinite(num)) return '0,00';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};
