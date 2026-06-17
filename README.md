# GlyciBio — Épicerie bio à index glycémique maîtrisé

> Application e-commerce **full-stack sécurisée** : une épicerie bio en ligne où chaque
> produit affiche son **index glycémique (IG)**, ses nutriments et ses allergènes.
> Projet réalisé dans le cadre du **Titre Professionnel DWWM** (RNCP niveau 5).

🌐 **En ligne : [https://glycibio.fr](https://glycibio.fr)**

---

## Stack technique

| Couche | Technologies |
|---|---|
| **Front-end** | React 19, Vite 6, Redux Toolkit + RTK Query, React Router 7, SCSS (design tokens, thème clair/sombre), self-hosted fonts (RGPD) |
| **Back-end** | Node.js 20, Express 5, MySQL 8 (InnoDB, transactions, triggers, FULLTEXT), JWT, bcrypt |
| **Paiement** | Stripe Checkout + webhooks (signés) |
| **E-mails** | Nodemailer (SMTP) — confirmation de commande, vérification d'e-mail, reset mot de passe |
| **Infra / déploiement** | VPS OVH (Ubuntu), Nginx (HTTPS, HTTP/2, CSP, cache), PM2, MySQL local — *front et API same-origin* |
| **Qualité** | `node --test` (unitaires + intégration MySQL), ESLint, CI GitHub Actions, `npm audit` |

## Fonctionnalités

- **Catalogue** : recherche plein-texte, filtres (IG, prix, catégorie), tri, pagination, fiche produit + galerie, **IgMeter** (jauge IG signature).
- **Compte** : inscription, connexion, **vérification d'e-mail**, reset mot de passe, profil + adresse, suppression de compte (RGPD).
- **Achat** : panier (invité + connecté), **tunnel Stripe** (+ repli sans Stripe), **livraison gratuite ≥ 50 €** (vérifiée serveur), historique des commandes, avis modérés, favoris.
- **Back-office admin** : produits (CRUD + upload images WebP responsives), catégories, **commandes** (statuts, **remboursement**), utilisateurs, avis, livraison, messages, tableau de bord.
- **Sécurité** : bcrypt(12), JWT HttpOnly, **CSRF double-submit**, Helmet, CORS strict, rate-limiting + verrouillage de compte, requêtes SQL paramétrées, validation des uploads (*magic bytes*), webhooks Stripe signés. Détail : [`dossier/03-securite-owasp.md`](dossier/03-securite-owasp.md).

## Structure du dépôt

```
client/     Front React/Vite (SPA)
server/     API Node/Express + tests (server/tests)
database/   Schéma SQL de production + données de référence
deploy/     Runbook + config Nginx de production (deploy/README.md)
docker/     docker-compose + Dockerfiles (dev/local)
dossier/    Pièces du dossier DWWM (modèle de données, jeu d'essai, OWASP)
docs/        Guides de déploiement détaillés (hors dépôt)
```

## Lancer en local

**Option Docker (tout-en-un)** — depuis `docker/` (nécessite `docker/.env`) :
```bash
cd docker && docker compose up -d --build
# Front : http://localhost  ·  API : http://localhost:5000/api
```

**Option native (dev)** — MySQL requis (le `server/.env` de dev pointe sur le port 3307) :
```bash
# 1) Base : charger database/glycibio-database-production.sql dans MySQL
# 2) API
cd server && npm install && npm run dev        # http://localhost:5000
# 3) Front
cd client && npm install --legacy-peer-deps && npm run dev   # http://localhost:5173
```
> `server/.env` et `client/.env` ne sont pas versionnés — voir `*.env.example`.

## Tests & qualité

```bash
cd server && npm test          # node --test (unitaires + intégration MySQL si TEST_DB_* défini)
cd client && npm run lint      # ESLint
cd client && npm run build     # build de production
```
La **CI GitHub Actions** (`.github/workflows/ci.yml`) exécute install → lint → build → tests (avec un service MySQL réel) → audit de sécurité.

## Déploiement

Mise en ligne sur VPS OVH (Nginx + PM2 + MySQL). Mise à jour après un push sur `main` :
```bash
cd ~/glycibio && bash deploy/deploy.sh
```
Runbook complet : [`deploy/README.md`](deploy/README.md).

## Dossier DWWM

- [`dossier/01-modele-de-donnees.md`](dossier/01-modele-de-donnees.md) — MCD / MLD / dictionnaire de données
- [`dossier/02-jeu-d-essai.md`](dossier/02-jeu-d-essai.md) — jeu d'essai
- [`dossier/03-securite-owasp.md`](dossier/03-securite-owasp.md) — couverture OWASP Top 10
- [`JURY_IMPROVEMENTS.md`](JURY_IMPROVEMENTS.md) — améliorations & mise en production
- [`DESIGN.md`](DESIGN.md) — design system
