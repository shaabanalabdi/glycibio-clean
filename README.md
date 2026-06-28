<div align="center">

# 🌿 GlyciBio

**Boutique en ligne d'aliments à index glycémique (IG) contrôlé**

Projet fil rouge — Titre professionnel **Développeur Web et Web Mobile (DWWM)** · RNCP37674 (TP-01280)
*Shaaban MOUSSA ALABDI — M2i Formation, Schiltigheim · 2025–2026*

🌐 **En production : [https://glycibio.fr](https://glycibio.fr)** &nbsp;·&nbsp; 🩺 Sonde : [`/api/health`](https://glycibio.fr/api/health)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-20_LTS-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-Checkout-635BFF?logo=stripe&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

</div>

> **Note pour le jury.** Ce dépôt contient le **code source complet** du projet. L'application est **réellement déployée** ;
> le moyen le plus rapide d'évaluer le fonctionnel est de visiter **[glycibio.fr](https://glycibio.fr)**. Pour la revue de code,
> ce README explique la structure du dépôt et propose **trois façons de lancer le projet** (production, local, Docker).
> Le *Dossier de Projet* (PDF) est fourni séparément.

---

## Sommaire

1. [Présentation](#1-présentation)
2. [Pile technologique](#2-pile-technologique)
3. [Architecture](#3-architecture)
4. [Structure du dépôt](#4-structure-du-dépôt)
5. [Démarrage rapide](#5-démarrage-rapide)
6. [Variables d'environnement](#6-variables-denvironnement)
7. [Base de données](#7-base-de-données)
8. [Tests et qualité](#8-tests-et-qualité)
9. [Intégration continue (CI)](#9-intégration-continue-ci)
10. [Sécurité](#10-sécurité)
11. [Déploiement](#11-déploiement)
12. [Cartographie des compétences DWWM](#12-cartographie-des-compétences-dwwm-cp1cp8)
13. [Comptes et test de paiement](#13-comptes-et-test-de-paiement)

---

## 1. Présentation

GlyciBio est une **boutique e-commerce full-stack** spécialisée dans les aliments à index glycémique contrôlé.
Chaque produit affiche clairement son **IG** (badge couleur bas / modéré / élevé), ses **allergènes** et ses **valeurs
nutritionnelles**. L'application couvre l'intégralité du parcours marchand : catalogue et recherche, panier (invité ou
connecté), compte client, **paiement en ligne sécurisé (Stripe Checkout)**, suivi de commandes, avis modérés, favoris,
fonctionnalités **RGPD** (export / effacement des données), ainsi qu'un **espace d'administration** complet
(tableau de bord, CRUD, modération, gestion des utilisateurs).

Projet conçu, développé, sécurisé, testé et déployé **intégralement en solo**.

## 2. Pile technologique

| Couche | Technologies |
|---|---|
| **Front-end** | React 19 + Vite 6, React Router 7, Redux Toolkit / **RTK Query**, Sass (SCSS, **BEM**, architecture 7-1) — *design system maison, aucun framework CSS* |
| **Back-end** | Node.js 20 LTS, **Express 5** (ESM), architecture en couches **Controller → Service → Repository → Entity** |
| **Base de données** | **MySQL 8** (InnoDB) — pilote `mysql2`, **sans ORM** (SQL paramétré) + colonnes **JSON natives** (volet NoSQL) |
| **Paiement** | **Stripe Checkout** (page hébergée) + **webhook signé** (idempotence exactly-once) |
| **Tests** | Runner natif **`node:test`** (zéro dépendance) — unitaires + intégration MySQL réelle |
| **CI** | **GitHub Actions** — 5 jobs (lint+build+audit, tests front, tests back, intégration MySQL, audit web) |
| **Production** | VPS OVH (Ubuntu 24.04), **Nginx** (reverse-proxy + TLS), **PM2**, HTTPS **Let's Encrypt**, **Docker** |

## 3. Architecture

Application **3-tiers** :

```
┌─────────────┐   HTTPS    ┌──────────────────┐  mysql2   ┌────────────┐
│  Navigateur │ ─────────► │  API REST Express │ ────────► │  MySQL 8   │
│ React (SPA) │  JSON      │ (Nginx + PM2)     │  (préparé)│ (InnoDB)   │
└─────────────┘            └──────────────────┘           └────────────┘
       │  redirection + saisie carte        ▲ webhook signé
       ▼                                    │
                         ┌──────────────────────────┐
                         │   Stripe Checkout (PCI)   │
                         └──────────────────────────┘
```

- **13 tables**, 1 procédure stockée, 6 déclencheurs, 4 vues d'agrégation, 1 index FULLTEXT.
- **API REST : ~73 points d'entrée HTTP** organisés par ressource + espace `/admin`.
- **Front : 22 pages** (21 en *lazy loading*), état serveur géré par **RTK Query** (12 slices, 65 endpoints, 20 tagTypes).

## 4. Structure du dépôt

```
glycibio-clean/
├── client/                  # Front-end React 19 + Vite (SPA)
│   ├── src/
│   │   ├── components/       # Composants UI (Navbar, ProductCard, …)
│   │   ├── pages/            # 22 pages (lazy-loaded)
│   │   ├── store/apiSlice/   # RTK Query — API unique + 12 slices injectés
│   │   ├── hooks/            # 6 hooks métier (session, panier, favoris, SEO…)
│   │   └── assets/style/    # Design system SCSS (architecture 7-1, BEM)
│   └── .env.example
├── server/                  # API REST Node.js / Express 5 (ESM)
│   ├── src/
│   │   ├── controller/       # Contrôleurs (+ admin/)
│   │   ├── services/         # Logique métier (tarification, machine à états, Stripe…)
│   │   ├── repository/       # 12 repositories + classe de base Repository
│   │   ├── entity/           # Entités
│   │   ├── middleware/       # Auth, CSRF, rate-limit, validation, erreurs
│   │   ├── router/routes/    # Définition des routes (+ admin/)
│   │   ├── cron/             # Tâches planifiées (panier abandonné, expiration)
│   │   └── core/             # DB, env, Repository/Entity de base
│   ├── tests/                # Tests node:test (unitaires + intégration MySQL)
│   ├── scripts/              # backup-db.cjs, seed-demo.js
│   └── .env.example
├── database/
│   └── glycibio-database-production.sql   # Schéma + données de référence (~516 lignes)
├── docker/                  # docker-compose.yml + Dockerfile.node + Dockerfile.client
├── deploy/                  # deploy.sh idempotent, Nginx, systemd, RUNBOOK-OPS.md, README.md
└── .github/workflows/ci.yml # Pipeline CI (5 jobs)
```

> Le dossier `docs/` (Dossier de Projet, captures) est **volontairement non versionné** (`.gitignore`) et fourni à part.

## 5. Démarrage rapide

> **Prérequis pour un lancement local : Node.js 20 LTS** et **MySQL 8** (ou Docker).

### Option A — Visiter la production *(zéro installation)*

👉 **[https://glycibio.fr](https://glycibio.fr)** — application réelle, HTTPS valide.
Vérifier l'état : [`https://glycibio.fr/api/health`](https://glycibio.fr/api/health) → `{"status":"OK","db":"up"}`.

### Option B — Lancement local manuel *(idéal pour la revue de code)*

```bash
# 1) Cloner
git clone https://github.com/shaabanalabdi/glycibio-clean.git
cd glycibio-clean

# 2) Base de données : créer la base puis injecter le schéma + données
mysql -u root -p -e "CREATE DATABASE glycibio CHARACTER SET utf8mb4;"
mysql -u root -p glycibio < database/glycibio-database-production.sql

# 3) API (back-end)
cd server
cp .env.example .env          # puis renseigner DB_*, JWT_SECRET, STRIPE_* …
npm install
npm run dev                   # API sur http://localhost:5000  (route /api)

# 4) Client (front-end) — dans un second terminal
cd ../client
cp .env.example .env          # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev                   # SPA sur http://localhost:5173
```

Ouvrir **http://localhost:5173**.

### Option C — Docker Compose *(environnement reproductible)*

```bash
# Renseigner les secrets attendus par la stack (cf. server/.env.example pour
# les noms de variables) dans docker/.env, puis :
docker compose -f docker/docker-compose.yml up --build
```

| Service | Conteneur | Accès |
|---|---|---|
| Client (Nginx) | `glycibio-client` | http://localhost:**80** |
| API (Express) | `glycibio-api` | http://localhost:**5005** → `/api` |
| MySQL 8 | `glycibio-db` | `localhost:**3307**` |

La base est initialisée automatiquement, et un *healthcheck* surveille `/api/health`.

## 6. Variables d'environnement

Les secrets ne sont **jamais** versionnés (`.env` est dans `.gitignore`). Deux fichiers `.env.example`
**documentent chaque clé** sans valeur :

- **`server/.env.example`** — `PORT`, `DB_*`, `JWT_SECRET`/`JWT_ALGO`/`JWT_EXPIRES_IN`, `CORS_ORIGIN`,
  `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CLIENT_URL`, `PUBLIC_BASE_URL`, SMTP, `TRUST_PROXY`,
  `DISABLE_CRON`, (Sentry & sauvegardes en option).
- **`client/.env.example`** — `VITE_API_URL` (dev : `http://localhost:5000/api` · prod : `/api` same-origin).

## 7. Base de données

Un **script SQL de production unique** (`database/glycibio-database-production.sql`, ~516 lignes) contient :

- le **schéma complet** (13 tables InnoDB, clés étrangères, contraintes `CHECK`, colonne générée `STORED`,
  colonnes `JSON`, index `FULLTEXT`) ;
- la **logique embarquée** : 1 procédure stockée (`sp_recalc_order_totals`), 6 déclencheurs, 4 vues d'agrégation ;
- des **données de référence réelles** : 9 catégories, 25 produits, 4 modes de livraison, 1 compte administrateur
  *(le catalogue en ligne est ensuite enrichi via le back-office)*.

Le script est **ré-exécutable** (`DROP` en tête). Principe du **moindre privilège** : l'application se connecte via un
utilisateur dédié (`glycibio_app`), jamais `root`.

## 8. Tests et qualité

```bash
# Tests back-end (unitaires ; les tests d'intégration MySQL sont actifs si TEST_DB_* est défini)
cd server && npm test

# Tests front-end
cd client && npm test
```

- **74 tests automatisés** : 71 côté serveur (dont **10 d'intégration** sur vraie base MySQL 8, exécutés en CI) + 3 côté client.
- Couverture : validation, sécurité (CSRF / JWT / *magic bytes*), tarification serveur, machine à états, idempotence du paiement.
- Scores **Lighthouse** (production) : **99 / 100 / 96 / 100** (desktop) · **84 / 100 / 96 / 100** (mobile).

## 9. Intégration continue (CI)

`.github/workflows/ci.yml` — déclenché à chaque `push` sur `main` (et `hardening`) et sur chaque *pull request*.
Pipeline **à 5 jobs** (Node 20) :

1. **Qualité** — lint + build + `npm audit`
2. **Tests front** · 3. **Tests back** · 4. **Intégration MySQL 8** (service conteneurisé) · 5. **Audit web** (Lighthouse + Pa11y, non bloquant)

> Intégration continue (CI) **sans** déploiement automatique (CD) : la mise en production reste manuelle via `deploy/deploy.sh` — distinction assumée.

## 10. Sécurité

Mesures cartographiées sur l'**OWASP Top 10 (2021)** :

- **Auth** : JWT signé en **cookie HttpOnly** (24 h), mots de passe **bcrypt (coût 12)**, politique forte, verrouillage de compte, invalidation de session (`tokens_valid_after`, *fail-closed*).
- **CSRF** : *double-submit cookie* + comparaison à temps constant (`timingSafeEqual`).
- **Injection SQL** : requêtes **100 % paramétrées** (`mysql2`), `ORDER BY` en **liste blanche**.
- **XSS** : rendu React auto-échappé, jamais de `dangerouslySetInnerHTML`.
- **En-têtes** : Helmet (Express) + **CSP stricte / HSTS** délivrées par **Nginx** (script-src par *hash* sha256, `frame-ancestors 'none'`, `X-Frame-Options: DENY`).
- **Contrôle d'accès** : autorisation côté serveur (rôle JWT) + vérification de **propriété** (parade IDOR/BOLA).
- **Rate limiting** : 4 niveaux (global 300/min, auth 5/min, contact 5/h, admin 200/min).
- **Paiement** : webhook Stripe **à signature vérifiée** sur le corps brut, marquage **idempotent** (exactly-once).
- **Secrets** : isolés en `.env` non versionné ; `.env.example` documente sans révéler.

## 11. Déploiement

Tout est documenté dans **[`deploy/`](deploy/)** :

- **[`deploy/README.md`](deploy/README.md)** — procédure de déploiement et configuration.
- **[`deploy/RUNBOOK-OPS.md`](deploy/RUNBOOK-OPS.md)** — exploitation (incidents, rotation des secrets…).
- **[`deploy/deploy.sh`](deploy/deploy.sh)** — script **idempotent** *zéro-downtime* : `git pull → build → deps → nginx -t → pm2 reload → /api/health`.
- **[`deploy/nginx/`](deploy/nginx/)** — reverse-proxy, terminaison TLS, CSP/HSTS, routage SPA.
- **[`deploy/systemd/`](deploy/systemd/)** — sauvegardes automatiques (`mysqldump`).

Production : VPS **OVH** (Ubuntu 24.04), **Nginx** + **PM2** (process `glycibio-api`, mode *fork*), HTTPS **Let's Encrypt** (Certbot), pare-feu **UFW** (22 / 80 / 443).

## 12. Cartographie des compétences DWWM (CP1–CP8)

Repère rapide pour situer chaque compétence dans le code :

| Code | Compétence (REAC V04) | Où regarder |
|---|---|---|
| **CP1** | Installer et configurer l'environnement | `.github/workflows/ci.yml`, `deploy/`, `docker/` |
| **CP2** | Maquetter des interfaces | (Figma — voir Dossier de Projet) + `client/src/assets/style/` |
| **CP3** | Réaliser des interfaces statiques | `client/src/components/` (HTML sémantique, SCSS/BEM) |
| **CP4** | Développer la partie dynamique des IU | `client/src/store/apiSlice/` (RTK Query), `client/src/hooks/` |
| **CP5** | Mettre en place une base relationnelle | `database/glycibio-database-production.sql` |
| **CP6** | Composants d'accès aux données (SQL + NoSQL) | `server/src/repository/`, `server/src/core/Repository.js` |
| **CP7** | Composants métier côté serveur | `server/src/services/` (tarification, machine à états, Stripe) |
| **CP8** | Documenter le déploiement | `deploy/README.md`, `deploy/RUNBOOK-OPS.md` |

## 13. Comptes et test de paiement

- **Espace d'administration** : compte `admin@glycibio.fr` *(mot de passe communiqué au jury séparément — non versionné, haché en base)*.
- **Paiement Stripe (mode test)** : carte **`4242 4242 4242 4242`**, date future quelconque, CVC à 3 chiffres.
- Sonde de santé : `GET /api/health` → `{"status":"OK","db":"up"}`.

---

<div align="center">

**GlyciBio** — Dossier de Projet DWWM · Shaaban MOUSSA ALABDI · M2i Formation · 2025–2026
🌐 [glycibio.fr](https://glycibio.fr)

</div>
