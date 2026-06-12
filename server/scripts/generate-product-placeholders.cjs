// ============================================================
// One-off : generate placeholder product images
// Run from server/ : node scripts/generate-product-placeholders.js
// Produces 800x800 .webp files in uploads/products/
// matching the filenames referenced in the database seed.
// Replace any of these with real photos via the admin UI later.
// ============================================================
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const OUT_DIR = path.join(__dirname, '..', 'uploads', 'products');

const PRODUCTS = [
  { file: 'pates-completes.webp',    name: 'Pates completes bio',                          cat: 'cereales' },
  { file: 'riz-basmati.webp',        name: 'Riz basmati',                                  cat: 'cereales' },
  { file: 'pain-graines.webp',       name: 'Pain complet aux graines',                     cat: 'cereales' },
  { file: 'farine-sarrasin.webp',    name: 'Farine de sarrasin',                           cat: 'cereales' },
  { file: 'pommes-granny.webp',      name: 'Pommes Granny Smith (1kg)',                    cat: 'fruits'   },
  { file: 'lentilles-puy.webp',      name: 'Lentilles vertes du Puy (500g)',               cat: 'fruits'   },
  { file: 'patates-douces.webp',     name: 'Patates douces (1kg)',                         cat: 'fruits'   },
  { file: 'yaourt-grec.webp',        name: 'Yaourt grec nature (x4)',                      cat: 'laitiers' },
  { file: 'lait-amande.webp',        name: 'Lait d amande sans sucre (1L)',                cat: 'laitiers' },
  { file: 'matcha.webp',             name: 'The vert matcha bio (100g)',                   cat: 'boissons' },
  { file: 'eau-coco.webp',           name: 'Eau de coco naturelle (330ml)',                cat: 'boissons' },
  { file: 'barres-proteinees.webp',  name: 'Barres proteinees amande-cacao (x6)',          cat: 'snacks'   },
  { file: 'crackers-sarrasin.webp',  name: 'Crackers de sarrasin (200g)',                  cat: 'snacks'   },
  { file: 'chocolat-85.webp',        name: 'Chocolat noir 85% (100g)',                     cat: 'sucree'   },
  { file: 'confiture-fraises.webp',  name: 'Confiture de fraises sans sucre ajoute (300g)',cat: 'sucree'   },
  { file: 'miel-acacia.webp',        name: 'Miel d acacia bio (250g)',                     cat: 'sucree'   },
  { file: 'huile-olive.webp',        name: 'Huile d olive extra vierge bio (500ml)',       cat: 'salee'    },
  { file: 'sauce-tomate.webp',       name: 'Sauce tomate artisanale (350g)',               cat: 'salee'    },
  { file: 'proteine-pois.webp',      name: 'Proteine de pois bio (500g)',                  cat: 'compl'    },
  { file: 'farine-coco.webp',        name: 'Farine de coco bio (400g)',                    cat: 'compl'    },
  { file: 'stevia-poudre.webp',      name: 'Stevia pure en poudre (100g)',                 cat: 'edu_nat'  },
  { file: 'erythritol.webp',         name: 'Erythritol cristallise (500g)',                cat: 'edu_nat'  },
  { file: 'monk-fruit.webp',         name: 'Monk Fruit en poudre (100g)',                  cat: 'edu_nat'  },
  { file: 'stevia-erythritol.webp',  name: 'Melange Stevia et Erythritol (500g)',          cat: 'edu_nat'  },
  { file: 'xylitol.webp',            name: 'Xylitol naturel (500g)',                       cat: 'edu_nat'  },
];

const PALETTE = {
  cereales: { from: '#f5e9c8', to: '#d9b86a', accent: '#8a5a1a', label: 'Cereales' },
  fruits:   { from: '#ffe4d6', to: '#ff9a76', accent: '#a23a1a', label: 'Fruits & Legumes' },
  laitiers: { from: '#eef4ff', to: '#a8c4ff', accent: '#26408b', label: 'Laitiers' },
  boissons: { from: '#dff5e1', to: '#74c69d', accent: '#1b4332', label: 'Boissons' },
  snacks:   { from: '#fff1cc', to: '#f1b24a', accent: '#7a4a05', label: 'Snacks' },
  sucree:   { from: '#f6dbe5', to: '#d97aa6', accent: '#6a1c3c', label: 'Epicerie sucree' },
  salee:    { from: '#e8efe1', to: '#9bb87c', accent: '#3c5a26', label: 'Epicerie salee' },
  compl:    { from: '#ece6f7', to: '#9b8acb', accent: '#3d2a6b', label: 'Complements' },
  edu_nat:  { from: '#dff3f5', to: '#6cc1cb', accent: '#114852', label: 'Edulcorants' },
};

const wrap = (text, maxChars) => {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const candidate = line ? `${line} ${w}` : w;
    if (candidate.length > maxChars && line) {
      lines.push(line);
      line = w;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
};

const escapeXml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const buildSvg = ({ name, cat }) => {
  const c = PALETTE[cat];
  const lines = wrap(name, 18);
  const fontSize = lines.length > 3 ? 52 : lines.length > 2 ? 60 : 68;
  const lineHeight = fontSize * 1.15;
  const totalH = lines.length * lineHeight;
  const startY = 480 - totalH / 2 + fontSize;

  const tspans = lines
    .map((ln, i) => `<tspan x="400" y="${Math.round(startY + i * lineHeight)}">${escapeXml(ln)}</tspan>`)
    .join('');

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c.from}"/>
      <stop offset="100%" stop-color="${c.to}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#bg)"/>
  <circle cx="400" cy="320" r="150" fill="${c.accent}" fill-opacity="0.12"/>
  <circle cx="400" cy="320" r="90"  fill="${c.accent}" fill-opacity="0.18"/>
  <text x="400" y="160" text-anchor="middle"
        font-family="'Segoe UI', Helvetica, Arial, sans-serif"
        font-size="28" font-weight="600" fill="${c.accent}" letter-spacing="6">
    ${escapeXml(c.label.toUpperCase())}
  </text>
  <text text-anchor="middle"
        font-family="'Segoe UI', Helvetica, Arial, sans-serif"
        font-size="${fontSize}" font-weight="700" fill="${c.accent}">
    ${tspans}
  </text>
  <text x="400" y="740" text-anchor="middle"
        font-family="'Segoe UI', Helvetica, Arial, sans-serif"
        font-size="22" font-weight="500" fill="${c.accent}" fill-opacity="0.7">
    Glycibio
  </text>
</svg>`.trim();
};

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  let written = 0;
  for (const p of PRODUCTS) {
    const out = path.join(OUT_DIR, p.file);
    const svg = Buffer.from(buildSvg(p));
    await sharp(svg).webp({ quality: 85 }).toFile(out);
    written++;
    console.log(`  ${p.file}`);
  }
  console.log(`\nDone. Wrote ${written} placeholder images to ${OUT_DIR}`);
})().catch((err) => {
  console.error('Failed to generate placeholders:', err);
  process.exit(1);
});
