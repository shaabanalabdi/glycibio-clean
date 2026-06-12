// ============================================================
// Script helper : process-generated-image.js
// Importe une image generee (PNG/JPG) et cree l'image produit
// WebP principale et ses variantes.
//
// Utilisation :
//   node scripts/process-generated-image.js <path_to_png> <target_filename.webp>
// ============================================================
const path = require('path');
const fs = require('fs');
const { processImageWithVariants } = require('../src/utils/imageProcessor');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'products');

const main = async () => {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node scripts/process-generated-image.js <input_path> <target_filename.webp>');
    process.exit(1);
  }

  const inputPath = path.resolve(args[0]);
  const targetFilename = args[1];

  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Input file does not exist at ${inputPath}`);
    process.exit(1);
  }

  if (!targetFilename.endsWith('.webp')) {
    console.error('Error: Target filename must end with .webp');
    process.exit(1);
  }

  const outputPath = path.join(UPLOAD_DIR, targetFilename);

  console.log(`Processing ${inputPath} -> ${outputPath}...`);

  try {
    const inputBuffer = fs.readFileSync(inputPath);
    await processImageWithVariants(inputBuffer, outputPath, {
      mainWidth: 800,
      variants: [480, 1280],
      quality: 85,
    });
    console.log('Success! Created main image and variants.');
  } catch (err) {
    console.error('Failed to process image:', err);
    process.exit(1);
  }
};

main();
