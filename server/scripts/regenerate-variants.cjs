// ============================================================
// Script one-shot : (re)genere les variantes responsives pour
// toutes les images produits + galerie deja en BDD.
//
// Utilisation :
//   node server/scripts/regenerate-variants.js
//
// Conditions :
//   - le fichier "main" (URL stockee en BDD) doit toujours exister
//     sur disque dans uploads/products/
//   - si le main est manquant, le produit/image est skippe avec un warning
//
// Idempotent : ecrase les variantes existantes (utile si on change la
// politique de qualite / largeur ulterieurement).
// ============================================================
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const pool = require('../src/config/database');
const {
  processImageWithVariants,
  RESPONSIVE_VARIANTS,
} = require('../src/utils/imageProcessor');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'products');

// Convertit l'URL BDD (/uploads/products/photo.webp) en chemin disque absolu
const urlToDiskPath = (url) => {
  if (!url || !url.startsWith('/uploads/products/')) return null;
  const filename = path.basename(url);
  return path.join(UPLOAD_DIR, filename);
};

/**
 * Pour une image deja stockee en BDD, regenere ses variantes a partir du
 * fichier main (qui sert de "source verite"). Les variantes sont sauvegardees
 * a cote selon la convention `<base>-<width>.webp`.
 */
const regenerateOne = async (url, opts = {}) => {
  const mainPath = urlToDiskPath(url);
  if (!mainPath) return { ok: false, reason: 'invalid_url' };
  if (!fs.existsSync(mainPath)) return { ok: false, reason: 'missing_file' };

  // Le "main" sert de source. Pour les variantes, on relit le main lui-meme.
  // Pour eviter l'erreur "Cannot use same file for input and output" de Sharp
  // lors de la re-generation du main, on charge le fichier en memoire (Buffer).
  try {
    const inputBuffer = fs.readFileSync(mainPath);
    await processImageWithVariants(inputBuffer, mainPath, {
      mainWidth: opts.mainWidth || 800,
      variants: opts.variants || RESPONSIVE_VARIANTS,
      quality: opts.quality || 80,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
};

const main = async () => {
  console.log('=== Regeneration des variantes responsives ===\n');

  // 1) Images principales des produits (products.image)
  const [products] = await pool.query(
    'SELECT id, image FROM products WHERE image IS NOT NULL AND image LIKE ?',
    ['/uploads/products/%']
  );
  console.log(`Produits a traiter : ${products.length}`);

  let ok = 0;
  let skipped = 0;
  let failed = 0;
  for (const p of products) {
    const res = await regenerateOne(p.image, { mainWidth: 800 });
    if (res.ok) {
      ok += 1;
      process.stdout.write('.');
    } else if (res.reason === 'missing_file') {
      skipped += 1;
      process.stdout.write('s');
    } else {
      failed += 1;
      process.stdout.write('x');
      console.log(`\n  [warn] product #${p.id} (${p.image}) : ${res.reason}`);
    }
  }
  console.log(`\n  -> ${ok} ok, ${skipped} skipped (fichier absent), ${failed} echec`);

  // 2) Images de galerie (product_images.url)
  const [gallery] = await pool.query(
    'SELECT id, url FROM product_images WHERE url IS NOT NULL AND url LIKE ?',
    ['/uploads/products/%']
  );
  console.log(`\nImages de galerie a traiter : ${gallery.length}`);

  ok = skipped = failed = 0;
  for (const g of gallery) {
    // Gallery main = 1280, variantes = [480, 800]
    const res = await regenerateOne(g.url, { mainWidth: 1280, variants: [480, 800] });
    if (res.ok) {
      ok += 1;
      process.stdout.write('.');
    } else if (res.reason === 'missing_file') {
      skipped += 1;
      process.stdout.write('s');
    } else {
      failed += 1;
      process.stdout.write('x');
      console.log(`\n  [warn] gallery #${g.id} (${g.url}) : ${res.reason}`);
    }
  }
  console.log(`\n  -> ${ok} ok, ${skipped} skipped, ${failed} echec`);

  console.log('\n=== Termine ===');
  await pool.end();
};

main().catch((err) => {
  console.error('Erreur fatale :', err);
  process.exit(1);
});
