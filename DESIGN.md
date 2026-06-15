# GlyciBio — Design System (DESIGN.md)

> Épicerie bio en ligne, spécialisée dans les produits à index glycémique (IG) maîtrisé.
> Identité 2026 : naturelle, chaleureuse, claire et rassurante. « Mangez mieux, en toute clarté. »
> Source de vérité pour générer des écrans cohérents (Stitch / Figma / autre).

## 1. Brand & Personality

- Mission : aider à stabiliser la glycémie via une épicerie bio dont chaque produit affiche son IG, ses nutriments et ses allergènes.
- Ton : bienveillant, expert mais accessible, transparent (la donnée IG est mise en avant, jamais cachée).
- Mots-clés visuels : nature, vert organique, canvas chaud (jamais gris froid), cartes nettes, beaucoup d'air, coins arrondis doux, ombres subtiles.
- Style : Organic / Biophilic + données claires. Flat, pas de skeuomorphisme. Icônes au trait (Lucide), jamais d'emoji comme icône.
- Langue de l'UI : Français.

## 2. Color tokens (sémantiques, Light / Dark)

Les composants n'utilisent QUE des tokens sémantiques, jamais les hex bruts.

| Token | Light | Dark | Usage |
|---|---|---|---|
| bg | #e9e6df | #131815 | Fond de page (canvas chaud / charbon-vert) |
| surface | #ffffff | #1c231e | Cartes |
| surface-alt | #fbfaf7 | #252d27 | Sections / surfaces douces |
| surface-elevated | #ffffff | #1c231e | Modals, drawers |
| text | #1d2b21 | #e9ece8 | Texte courant |
| text-strong | #14201a | #ffffff | Titres |
| text-muted | #586b5e | #aab4ac | Texte secondaire (AA) |
| text-faint | #6a786e | #8a948c | Texte tertiaire (AA) |
| on-primary | #ffffff | #ffffff | Texte sur boutons verts |
| border | #d8d0bd | #39423a | Bordures de cartes |
| border-strong | #c6bca4 | #4a554b | Bordures appuyées |
| input-bg | #ffffff | #1c231e | Champs |
| input-border | #d8d3c6 | #3f493f | Bordure de champ |
| accent | #3c7a26 | #4ea827 | Liens / titres verts / icônes (texte vert AA) |
| price | #1c5879 | #6fc6f0 | Prix (bleu profond) |
| tint-green-bg / -fg | #eef6e7 / #3c7a26 | rgba(78,168,39,.16) / #7fcf5a | Pastilles/tuiles vertes |
| tint-blue-bg / -fg | #e6f3fb / #1c5879 | rgba(36,157,223,.18) / #6fc6f0 | Pastilles/tuiles bleues |
| success-fg | #155724 | #6dd482 | Succès |
| error-fg | #dc3545 | #ff8088 | Erreur |
| warning-fg | #856404 | #ffd55a | Avertissement |
| info-fg | #0c5460 | #6cc2d1 | Info |

### Brand (constant, indépendant du thème)
- primary #3c7a26 (vert action, boutons/liens, AA 5.17:1 sur blanc) ; primary-dark #2f6020 (hover)
- secondary #249ddf (bleu confiance) ; secondary-dark #1c5879 (prix/accents)
- green-vivid #4ea827 (décoratif uniquement, pas en texte sur blanc)

### Index Glycémique (signature) — tous AA
- ig-bas #3c7a26 (IG <= 55) ; ig-moyen #b35e10 (56-69) ; ig-eleve #d42b20 (>= 70)
- Gradient IG (track IgMeter) : linear-gradient(90deg, #3c7a26 0%, #3c7a26 40%, #b35e10 60%, #d42b20 100%)

A11y : tout texte respecte WCAG AA (>= 4.5:1). Concevoir Light et Dark ensemble.

## 3. Typography

- Display / Headings : Bricolage Grotesque (titres, prix, chiffres).
- Body / UI : Hanken Grotesk.
- Base 16px. Line-height corps 1.6, titres 1.2.

| Style | Police | Taille (desktop) | Poids | LH |
|---|---|---|---|---|
| Display 3xl (hero) | Bricolage | 48 | Bold 700 | 1.2 |
| Heading 2xl | Bricolage | 36 | Bold 700 | 1.2 |
| Heading xl | Bricolage | 28 | SemiBold 600 | 1.2 |
| Heading lg | Bricolage | 22 | SemiBold 600 | 1.4 |
| Title md | Hanken | 18 | SemiBold 600 | 1.4 |
| Body base | Hanken | 16 | Regular 400 | 1.6 |
| Body sm | Hanken | 14 | Regular 400 | 1.6 |
| Price lg | Bricolage | 28 | Bold 700 | 1.2 |
| Label xs | Hanken | 13 | Medium 500 | 1.4 |

## 4. Spacing, radius, elevation

- Spacing (4/8 px) : 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Radius : xs 2, sm 9, base 12, lg 16, xl 20, 2xl 24 (coins doux).
- Elevation (ombres encre verte rgba(29,43,33,...)) :
  - sm : 0 1px 2px /.08 + 0 4px 10px /.10
  - md : 0 2px 6px /.10 + 0 10px 24px /.13
  - lg : 0 8px 16px /.12 + 0 24px 48px /.18

## 5. Core components

- Button — primary : fond primary, texte on-primary, radius 12, padding 14x24. outline : fond surface, bordure border-strong, texte accent. Pill « Ajouter » : radius 999.
- Product card — surface, bordure border, radius 16, clip. Haut : image. Sous l'image : bande signature IG (point coloré ig-* + libellé « IG bas / modéré / élevé »). Corps : nom (Title md), description (Body sm text-muted), pied : prix (Price lg price) + pill « Ajouter ».
- IgMeter — track = gradient IG (cf. §2) + curseur + libellé « Indice bas (40) ».
- Category card — pastille d'icône arrondie (tint vert/bleu en alternance) + nom (Title md). Stretched-link.
- Inputs — input-bg, bordure input-border, radius 9, label visible au-dessus (jamais placeholder seul), erreur sous le champ (error-fg).
- Navbar — surface, bordure basse border. Logo « GlyciBio » (Bricolage Bold, accent), liens, compte, panier (pill verte avec compteur).
- Footer — sombre #14201a, logo green-vivid, colonnes (Boutique / Aide / Légal), barre légale.
- Badges/chips — pastille radius 999, tints sémantiques.

## 6. Pages to design (light theme)

Storefront : Home (hero + trust strip + grille catégories + best-sellers + footer), Catalogue (sidebar filtres + grille produits + pagination), Produit (galerie + IgMeter + prix + allergènes + nutrition + ajout panier), Panier, Checkout (formulaire livraison/paiement + récap), Login, Inscription, Contact, Pages légales (CGV / confidentialité), 404.
Admin : Tableau de bord (barre latérale groupée + cartes KPI + tableaux + colonne Actions épinglée).

## 7. Do / Don't

- OK : canvas chaud, cartes nettes (bordure visible + ombre douce), prix en bleu profond, IG toujours affiché, icônes au trait cohérentes (Lucide), tap targets >= 44px, focus visible.
- NON : gris froid, emoji-icônes, texte gris-sur-gris, vert vif #4ea827 en texte sur blanc.
