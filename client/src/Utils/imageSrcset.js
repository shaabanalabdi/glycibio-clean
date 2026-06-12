// ============================================================
// Helpers <img srcset> pour les images produits / galerie.
//
// Convention serveur (cf. server/src/utils/imageProcessor.js) :
//   - "main"     : URL stockee en BDD, sans suffixe   ex: photo.webp
//   - variantes  : `<base>-<width>.webp` a cote       ex: photo-480.webp
//
// Defauts :
//   - products  : main 800, variantes [480, 1280]
//   - gallery   : main 1280, variantes [480, 800]
// Les anciennes images (non re-uploadees) n'ont pas de variantes -> le
// helper retourne null et le composant retombe sur `src=url` seul.
// ============================================================

import { resolveImageUrl } from './imageUrl.js';

const stripWebpSuffix = (url) => {
  if (!url) return null;
  if (url.endsWith('.webp')) return url.slice(0, -'.webp'.length);
  // Images legacy non-WebP (jpg/png) : pas de variantes, on retourne null
  return null;
};

/**
 * Construit un srcset pour un <img>.
 * @param {string} url        URL de l'image principale ("/uploads/products/photo.webp")
 * @param {Object} opts
 *   - mainWidth : width du "main" (default 800)
 *   - widths    : liste des widths a inclure (default [480, 800, 1280])
 * @returns {string|null}  srcset ou null si l'URL n'est pas en WebP
 */
export const buildSrcset = (url, { mainWidth = 800, widths = [480, 800, 1280] } = {}) => {
  const base = stripWebpSuffix(url);
  if (!base) return null;

  return widths
    .map((w) => {
      const fileUrl = w === mainWidth ? url : `${base}-${w}.webp`;
      return `${resolveImageUrl(fileUrl)} ${w}w`;
    })
    .join(', ');
};

// Presets pour les contextes les plus frequents
export const SRCSET_PRESETS = {
  // Carte catalogue / cross-sell : rendue a ~14rem (224px), max 320px sur grands ecrans
  card:    { mainWidth: 800,  widths: [480, 800, 1280],
             sizes: '(min-width: 992px) 320px, (min-width: 576px) 50vw, 100vw' },
  // Galerie produit : pleine largeur mobile, ~520px sur desktop (col gauche du grid)
  // mainWidth = 800 : le fichier "main" stocke en BDD est genere a MAIN_WIDTH=800
  // (cf. server/src/utils/imageProcessor.js). Le slot 1280 pointe alors vers la
  // variante reelle `-1280.webp`. Mettre mainWidth a 1280 demandait un `-800.webp`
  // jamais genere -> 404 -> image masquee.
  gallery: { mainWidth: 800, widths: [480, 800, 1280],
             sizes: '(min-width: 768px) 520px, 100vw' },
  // Vignette galerie : 4.5rem = 72px (96 a 1.5x DPR)
  thumb:   { mainWidth: 800,  widths: [480, 800],
             sizes: '72px' },
  // Cart item : 5rem = 80px (120 a 1.5x DPR)
  cartItem:{ mainWidth: 800,  widths: [480, 800],
             sizes: '80px' },
};
