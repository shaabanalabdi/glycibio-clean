# Handoff: GlyciBio — Visual & UX Refresh

## Overview
A full visual refresh of the **GlyciBio** e-commerce store (organic foods with a controlled
glycemic index, French market). It covers five existing screens — **Home, Catalog, Product detail,
Cart/Checkout** — plus one **new feature to build: "Mon Suivi IG"** (a personal glycemic-load
dashboard). The refresh keeps GlyciBio's brand DNA (nature green + trust blue, clean cards) and
elevates it with a real type pairing, a warm-neutral canvas, and one recurring signature device:
the **IG meter**, which makes the glycemic index legible on every screen.

## About the Design Files
The files in this bundle are **design references created in HTML** — a single prototype
(`GlyciBio Refresh.dc.html`) plus high-quality screenshots of each screen. They show the intended
look and behavior; they are **not production code to copy verbatim**.

The target codebase is the **`glycibio-clean` repo**: a React + Vite client (`client/`) styled with
**SCSS** (`client/src/assets/style/` — note `abstracts/_variables.scss`, `abstracts/_theme-tokens.scss`,
`components/_button.scss`, `components/_card.scss`). Your task is to **recreate these designs inside
that existing environment**, using its established component and SCSS patterns — extend the existing
ProductCard, Navbar, page components, and add the new Suivi IG page/route. Do **not** drop raw HTML
into the React app, and do **not** change any business logic, routing data, or API calls — this is a
styling + layout + one-new-page effort.

> Note: the prototype is built as a single scrollable document with six labeled sections only so all
> screens can be reviewed at once. In the real app these are separate routed pages.

## Fidelity
**High-fidelity (hifi).** Colors, typography, spacing, radii, and shadows are final and exact —
recreate the UI pixel-accurately using the codebase's SCSS variables and React components. Product
imagery is intentionally a **styled placeholder** (a diagonal hatched gradient) — wire real product
photos into the same slots; do not ship the placeholder.

---

## Design Tokens

### Brand colors
| Token | Hex | Use |
|---|---|---|
| `brand-green` | `#4ea827` | Primary actions, "Ajouter" buttons, active nav |
| `brand-green-deep` | `#3c7a26` | Green text on light, "IG bas" |
| `brand-green-light` | `#eef6e7` | Green tint surfaces / chips |
| `brand-blue` | `#249ddf` | Secondary actions, accents |
| `brand-blue-deep` | `#1c5879` | Prices, dashboard gradient |
| `brand-blue-light` | `#e6f3fb` | Blue tint surfaces |

### IG (glycemic index) scale — the signature motif
| Token | Hex | Range |
|---|---|---|
| `ig-bas` | `#3c7a26` | 0–55 (BAS) |
| `ig-moyen` | `#b35e10` | 56–69 (MODÉRÉ) |
| `ig-eleve` | `#d42b20` | 70+ (ÉLEVÉ) |
| `ig-gradient` | `linear-gradient(90deg,#3c7a26 0%,#3c7a26 40%,#b35e10 60%,#d42b20 100%)` | track fill |

### Neutrals (warm)
| Token | Hex | Use |
|---|---|---|
| `canvas` | `#e9e6df` | Page background (warm gray — never cool gray) |
| `surface` | `#fbfaf7` | App shell / frames |
| `card` | `#ffffff` | Cards, panels |
| `border` | `#e6e2d8` | Card/input borders (warm) |
| `border-soft` | `#ece8de` | Dividers, header borders |
| `ink` | `#1d2b21` | Primary text (green-tinted near-black) |
| `text-muted` | `#7a8a7f` | Secondary text |
| `text-faint` | `#9aa79e` | Captions, placeholders, eyebrow labels |

### Typography
- **Display (headings, prices, stat numbers):** `Bricolage Grotesque`, weights 400–800, `letter-spacing: -0.025em`, line-height 1.0–1.1.
- **Body / UI:** `Hanken Grotesk`, weights 400–800.
- Google Fonts: `family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Hanken+Grotesk:wght@400..800`
- Scale (desktop): H1 hero `clamp(38px,4.6vw,58px)` · page H3 30–32px · product title 38px · card title 15px · body 15–17px · caption 12–13px. **Never below 12px.**

### Radius
`sm 9px` · `md 12px` · `lg 16px` · `xl 20px` · `pill 999px`

### Shadow
- `shadow-card`: `0 1px 2px rgba(29,43,33,.05), 0 4px 12px rgba(29,43,33,.05)`
- `shadow-pop`: `0 8px 16px rgba(29,43,33,.06), 0 30px 60px rgba(29,43,33,.16)`

### Spacing
8px-based rhythm: 4 / 8 / 12 / 14 / 18 / 22 / 26 / 32 / 44 / 56px. Card padding 16px; section padding 28–32px; frame radius 20px.

---

## Signature component — `IgMeter` (BUILD FIRST)
Used **everywhere** an IG value appears. Create `client/src/components/IgMeter/`.

**Props:** `ig: number (0–100)`, `size: 'sm' | 'md' | 'lg'` (default `md`), `showBadge?: boolean`, `showScale?: boolean`.

**Logic:**
```js
const level = ig <= 55 ? 'bas' : ig <= 69 ? 'moyen' : 'eleve';
const color = { bas:'#3c7a26', moyen:'#b35e10', eleve:'#d42b20' }[level];
const label = { bas:'BAS', moyen:'MODÉRÉ', eleve:'ÉLEVÉ' }[level];
const pos   = Math.min(Math.max(ig, 2), 98); // marker left %
```
**Render:**
- Track: full-width pill, height `sm 6–7px / md 10px / lg 14px`, background = `ig-gradient`.
- Marker: white circle (`sm 12–14px / md 16–18px / lg 24px`), `border: 2.5–4px solid {color}`, soft shadow, absolutely positioned `left: {pos}%; transform: translate(-50%,-50%)`.
- `showBadge`: pill "IG {ig}" — white text on `{color}` bg, `white-space: nowrap`.
- `showScale` (lg only): three labels under track — `Bas · 0–55` (green) / `Modéré · 56–69` (orange) / `Élevé · 70+` (red).

---

## Screens / Views

### 1. Home (`/`)
**Purpose:** Land, communicate the IG-controlled positioning, surface low-IG products, tease Suivi IG.
**Layout:** App shell on `surface`. Sections stacked: navbar → hero → trust strip → featured grid → Suivi IG teaser.
**Components:**
- **Navbar** (sticky, white 85% + blur, `border-soft` bottom): logo (`glycibio-logo.png`, 38px) + "GlyciBio" (display 21px); nav links *Accueil / Catalogue / Mon suivi IG / À propos* (active = `ink` + 2px green underline); pill search field (`Rechercher un aliment`); profile icon button (44×44, `md` radius, white, `border`); green cart button with white count badge.
- **Hero** (`linear-gradient(160deg,#f1f8ec 0%,#eaf4fb 100%)`, padding 64px): two floating blurred radial orbs — green top-right, blue bottom-left — each animated (`translate`+`scale`, 14s / 16s `ease-in-out infinite`). Grid `1.05fr .95fr`. Left col: eyebrow pill (white 70%, green border) "Sélection 2026 · Index glycémique contrôlé" with star icon; H1 "Mangez sain, **maîtrisez votre glycémie**" (2nd line `brand-green`); subcopy (18px, `text-muted` darker); two CTAs — primary green "Voir le catalogue" (arrow icon, `shadow` green) + outline-blue "Découvrir le suivi IG"; 3 trust items (checkmark/truck/leaf icons, green). Right col: floating white showcase card (`shadow-pop`, radius 24px) = product photo placeholder + "IG 19 · BAS" green pill, category, name, **`IgMeter md`**, price (display 24px blue) + blue "Ajouter" button.
- **Trust strip** (white, `border-soft` bottom): 4 columns, each = 46px rounded icon tile (alternating green-light / blue-light) + display title + muted desc. Copy: *100% Naturel / IG Contrôlé / Livraison rapide / Bien-être*.
- **Featured grid:** "Vedettes" eyebrow (green uppercase) + H3 "Produits à faible IG" + outline "Tout voir" button; 4-col `ProductCard` grid, gap 22px.
- **Suivi IG teaser:** rounded 24px banner, `linear-gradient(135deg,#1c5879,#2a5719)`, white text, green radial glow top-right; "Nouveau · 2026" pill, H3, subcopy, white CTA "Activer mon suivi".

### 2. Catalog (`/catalogue`)
**Purpose:** Browse & filter the catalog, with IG as a first-class filter.
**Layout:** Slim navbar → breadcrumb+title bar (white) → body grid `264px 1fr`.
**Components:**
- **Sidebar** (white, right border): each section header has a 6×18px colored bar (green or blue) before its label.
  - **Index glycémique filter (signature):** the `ig-gradient` track with **two draggable handles** (dark-bordered white circles) + a highlighted selected sub-range; below, three toggle chips *Bas / Modéré / Élevé* (selected = green-light bg + green text); caption "0 – 55 sélectionné".
  - **Catégories:** checkbox list w/ counts (checked = green box + white check). Copy: Sucrants naturels (12) / Farines & féculents (9) / Céréales & petit-déj (8) / En-cas & chocolats (11) / Boissons (8).
  - **Régime:** pill toggles — Bio (selected, green-light) / Sans gluten / Vegan / Sans sucre ajouté.
- **Title bar:** breadcrumb "Accueil · Catalogue", H3 "Tous les aliments", "48 produits", sort dropdown "Trier : IG croissant".
- **Grid:** 3-col `ProductCard` grid (gap 20px) including an **out-of-stock** variant; pagination row (active page = green square 40×40, others white w/ border; chevron prev/next).

### 3. Product detail (`/produit/:id`)
**Purpose:** Decide to buy, with the IG front and center.
**Layout:** Slim navbar → breadcrumb → 2-col grid `1fr 1fr`, gap 44px.
**Components:**
- **Gallery:** square photo placeholder (radius 20px, `border`) with "IG 19 · BAS" green pill top-left (`white-space:nowrap`); 4 thumbnails below (active = 2px green border).
- **Info col:** category pills ("Sucrants naturels" green + "Bio" outline); H3 title 38px; star rating (4 filled + 1 outline, `#f2a517`) + "4,6 · 128 avis".
- **Big IG meter card** (white, `border`, radius 18px): "Index glycémique" label + huge number (display 30px green) "/ 100"; **`IgMeter lg` with `showScale`**; explainer sentence ("Un IG de 19 signifie une montée de la glycémie lente et faible — idéal en remplacement du sucre blanc (IG 70).").
- **Nutrition row:** 3 stat cards (kcal / glucides / lipides), number in display font.
- **Buy row** (top border): price (display 34px blue) + unit price caption; qty stepper (− value +, 54px tall, bordered); green "Ajouter au panier" (`shadow` green). Below: shipping + stock micro-trust line with icons.

### 4. Cart & Checkout (`/panier`)
**Purpose:** Review cart, see its glycemic load, check out.
**Layout:** Header w/ 3-step stepper → body grid `1fr 380px`.
**Components:**
- **Stepper** (header center): Panier → Livraison → Paiement; step 1 active (green circle), 2–3 muted (bordered circle); 36px connector lines.
- **Items col:** title "Votre panier" + "3 articles · tous à index glycémique bas"; each line = grid `84px 1fr auto` (thumb / details / qty+price). Details: uppercase category, name (display 16px), `IgMeter sm` + "IG {n}" pill. Right: price (display 18px blue) + compact qty stepper. "Continuer mes achats" text button with left-arrow.
- **Summary panel** (white, left border):
  - **"Charge glycémique du panier"** box (green-light bg, green border): checkmark label + `IgMeter sm` + verdict "IG moyen 24 · bas — excellent équilibre 👏".
  - Lines: Sous-total / Livraison (green "Offerte") / TVA incluse; promo input + "Appliquer"; **Total** (display 28px blue); big green "Passer la commande" (`shadow`); payment logos row (muted, VISA/MASTERCARD/PAYPAL).

### 5. Mon Suivi IG — NEW PAGE (`/suivi-ig`)
**Purpose:** Personal glycemic-load tracking; the conversion/retention hook. Add the nav link.
**Layout:** Header (logo + nav, profile avatar) → greeting+range toggle → stat row grid `1.4fr 1fr 1fr` → chart row grid `1.5fr 1fr`.
**Components:**
- **Greeting:** "Bonjour {name} 👋" (display) + subcopy; range toggle *Semaine / Mois / Année* (active = `brand-blue-deep` bg pill).
- **Hero gauge card** (`linear-gradient(135deg,#1c5879,#2a5719)`, white, green radial glow): "Charge glycémique moyenne", big number (display 56px), ±% pill (green tint, up/down arrow); `IgMeter` (use dark-bordered marker `#2a5719`) with caption "Objectif < 50 · atteint ✓".
- **Two stat cards** (white): rounded icon tile + big display number + caption — "6 / 7 jours sous votre objectif IG"; "23 aliments suivis cette semaine".
- **Weekly bar chart** (white card): title + legend (green = sous objectif, orange = au-dessus); 7 bars (Lun–Dim), bar color green gradient when value ≤ 50 else flat orange `#e0a341`, value label above (colored), day label below; height scaled against max 70. (Objective line at 50 — render as a dashed horizontal rule.)
- **Alternatives card** (white): "Alternatives à IG plus bas" + "Sur la base de vos achats récents"; 3 rows = thumb + "Current → Suggested" + "IG x → y" + green "−delta" with up-chevron; full-width blue "Ajouter les 3 au panier".

---

## Interactions & Behavior
- **Buttons:** subtle lift on hover (e.g. `translateY(-1px)` + slightly stronger shadow); primary green keeps its green glow shadow.
- **Hero orbs:** continuous `@keyframes` float (translate + scale), 14s / 16s, `ease-in-out infinite`. Respect `prefers-reduced-motion` (disable).
- **Catalog IG filter:** dragging either handle updates the selected sub-range and the result count; chips toggle bas/moyen/élevé bands.
- **Qty steppers:** −/+ adjust quantity, clamp at 1; cart totals + cart glycemic-load meter recompute live.
- **Cart glycemic load:** marker position = average IG of items (weighted by qty); verdict text/color follow the bas/moyen/élevé thresholds.
- **ProductCard:** heart toggles wishlist; out-of-stock → button disabled "Indisponible", card opacity .82, photo grayscale.
- **Suivi IG range toggle:** swaps the dataset feeding the gauge, stat cards, and bar chart.

## Responsive behavior
- **Navbar** collapses to logo + search icon + cart icon (hamburger for nav links).
- **Hero** → single column (card below copy).
- **Grids:** featured/catalog → 2-col then 1-col; product detail → stacked (gallery above info).
- **Cart** summary panel stacks below items (full width).
- **Suivi IG:** stat row and chart row stack; add a **bottom tab bar** (home / search / stats / profile) as in the mobile frame.
- Touch targets ≥ 44px. Mobile reference frame: **390 × 844**.

## State Management
- **Cart:** `items[] {id, name, category, price, qty, ig}` → derived `subtotal`, `vat`, `total`, `avgIg`. Persist (existing cart logic).
- **Catalog filters:** `igRange [min,max]`, `categories[]`, `regimes[]`, `sort` → filtered product list + count.
- **Product page:** `quantity`, selected gallery image, wishlist state.
- **Suivi IG:** `range ('semaine'|'mois'|'annee')` → `{avgLoad, deltaPct, daysUnderGoal, foodsTracked, dailyLoads[], suggestions[]}`. Data source: derive from the user's order history (new endpoint or computed client-side from existing orders).

## Assets
- `assets/glycibio-logo.png` — the GlyciBio mark (green leaf + blue bird). Already in the repo at `client/public/icon-512.png`; reuse it.
- **Icons:** simple 2px-stroke line icons (search, user, cart, truck, leaf, check-circle, star, chevrons, bar-chart, home). Use the repo's existing icon set / library — match the 2px stroke weight.
- **Product photos:** none provided. Placeholders are a diagonal hatched gradient `repeating-linear-gradient(135deg,#eef2e9 0 11px,#e7ede1 11px 22px)`. Replace with real photography in the same aspect ratios (cards 1:1, hero 4:3, product 1:1).

## Files
- `GlyciBio Refresh.dc.html` — the full hi-fi prototype (all six sections). Open in a browser to inspect exact markup, inline styles, and the chart/card rendering logic.
- `screens/01-home.png` … `screens/06-mobile.png` — high-res screenshots of each screen.
- `assets/glycibio-logo.png` — brand mark.
- `PROMPT.md` — a ready-to-paste implementation prompt for Claude Code.
