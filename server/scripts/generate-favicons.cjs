// One-off: extract the icon part (leaf + bird) from Logo.png and emit favicons.
// Run from c:/glycibio/server with: node scripts/generate-favicons.js
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SRC = path.resolve(__dirname, '../../client/src/logo/Logo.png');
const OUT = path.resolve(__dirname, '../../client/public');

(async () => {
  const meta = await sharp(SRC).metadata();
  console.log(`Source: ${meta.width}x${meta.height} ${meta.format}`);
  // The icon (leaf + bird) occupies roughly the leftmost square of the wordmark.
  // Logo is 873×242 → take the left 242×242 area.
  const side = Math.min(meta.width, meta.height);
  const square = await sharp(SRC)
    .extract({ left: 0, top: 0, width: side, height: side })
    .toBuffer();

  // Trim transparent edges then re-pad to clean square so the icon is centered.
  const trimmed = await sharp(square).trim({ threshold: 1 }).toBuffer();
  const tMeta = await sharp(trimmed).metadata();
  const finalSide = Math.max(tMeta.width, tMeta.height);
  const padded = await sharp({
    create: { width: finalSide, height: finalSide, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{
      input: trimmed,
      left: Math.round((finalSide - tMeta.width) / 2),
      top: Math.round((finalSide - tMeta.height) / 2),
    }])
    .png()
    .toBuffer();

  const sizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'favicon-96x96.png', size: 96 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
  ];

  for (const { name, size } of sizes) {
    await sharp(padded)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toFile(path.join(OUT, name));
    console.log(`  -> ${name} (${size}x${size})`);
  }

  // favicon.ico (single 32×32 PNG-in-ICO is accepted by all modern browsers)
  await sharp(padded).resize(32, 32).toFile(path.join(OUT, 'favicon.ico'));
  console.log('  -> favicon.ico (32x32)');

  console.log('Done.');
})();
