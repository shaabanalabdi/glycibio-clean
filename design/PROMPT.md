# Claude Code — GlyciBio Design Refresh Implementation Prompt

> Paste this into Claude Code at the root of the `glycibio-clean` repo. The `design_handoff_glycibio_refresh/`
> folder (this file's folder) contains the full spec (`README.md`), the HTML reference prototype, and
> screenshots of every screen. Read `README.md` first — it has exact tokens, measurements, and per-screen specs.

---

## Task
Apply the GlyciBio visual & UX refresh to the React + Vite client. Recreate the designs in
`design_handoff_glycibio_refresh/` (HTML reference + screenshots) **inside the existing React/SCSS
codebase** using its established component and style patterns. Build one new page (Mon Suivi IG).
**Do not** change routing data, API calls, or business logic — styling, layout, and the new page only.

## Ground rules
- Stack: **React + Vite** (`client/`), **SCSS** in `client/src/assets/style/` (`abstracts/_variables.scss`,
  `abstracts/_theme-tokens.scss`, `components/_button.scss`, `components/_card.scss`).
- Reuse the existing logo at `client/public/icon-512.png`.
- Keep all product images as the placeholder gradient until real photos are provided.
- Honor `prefers-reduced-motion`. Min font size 12px. Touch targets ≥ 44px.

## Order of work
1. **Tokens.** Update `_variables.scss` / `_theme-tokens.scss` with the colors, IG scale, neutrals (warm
   canvas `#e9e6df`), radii, and shadows from `README.md › Design Tokens`. Add the two Google fonts
   (`Bricolage Grotesque` for display/headings/prices, `Hanken Grotesk` for body) in `client/index.html`
   and wire `$font-display` / `$font-body`.
2. **`IgMeter` component (build first).** `client/src/components/IgMeter/` per `README.md › Signature
   component`. Props `ig`, `size`, `showBadge`, `showScale`. This is the recurring device — use it on
   product cards, the product page, cart lines, and the dashboard.
3. **Atoms.** Update Button (`_button.scss`: green primary w/ green glow shadow, outline-blue secondary,
   white tertiary), ProductCard (warm card, photo placeholder, IG badge + heart, `IgMeter sm`, price +
   green Ajouter; out-of-stock variant), and Navbar (white+blur, active link green underline, search pill,
   profile + green cart-count button).
4. **Pages**, matching the screenshots:
   - **Home** — hero w/ animated orbs + showcase card, trust strip, featured grid, Suivi IG teaser banner.
   - **Catalog** — sidebar with the **IG range filter** (dual-handle gradient slider) + categories + régime,
     title/sort bar, 3-col grid (+ out-of-stock), pagination.
   - **Product detail** — gallery, **big IG meter card** with the bas/modéré/élevé scale, nutrition stats,
     price + qty stepper + Ajouter au panier.
   - **Cart/Checkout** — 3-step stepper, line items with mini IG meters, summary panel with the
     **cart glycemic-load** box, totals, Passer la commande.
5. **NEW page — Mon Suivi IG** (`/suivi-ig`, add nav link): greeting + range toggle, hero gauge card,
   two stat cards, weekly bar chart (green ≤50 / orange >50, objective line at 50), lower-IG alternatives
   list with "Ajouter les 3 au panier". Feed it from order history (new endpoint or client-side derivation).
6. **Responsive** per `README.md › Responsive behavior` (collapsing navbar, stacking grids, mobile bottom
   tab bar on Suivi IG). Reference frame 390×844.

## Acceptance criteria
- [ ] Every IG value on the site renders through `<IgMeter />`.
- [ ] `Bricolage Grotesque` on all headings, prices, and stat numbers; `Hanken Grotesk` everywhere else.
- [ ] Warm canvas `#e9e6df` with white cards — never cool gray.
- [ ] Brand colors exact: green `#4ea827`/`#3c7a26`, blue `#249ddf`/`#1c5879`; IG scale green/orange/red `#3c7a26`/`#b35e10`/`#d42b20`.
- [ ] All five refreshed screens match their screenshots; Suivi IG page built and routed.
- [ ] No business logic, routing data, or API calls changed.
- [ ] Responsive at 390px; reduced-motion respected; no console errors; lint passes.

## Reference files in this folder
- `README.md` — full spec (tokens, IgMeter logic, per-screen component breakdowns, interactions, state).
- `GlyciBio Refresh.dc.html` — open in a browser to read exact inline styles and chart/card logic.
- `screens/01-home.png … 06-mobile.png` — target screenshots.
- `assets/glycibio-logo.png` — brand mark.
