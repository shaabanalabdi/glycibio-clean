# GlyciBio — Améliorations pour la soutenance DWWM

> Document de présentation jury (RNCP Niveau 5 — Développeur Web et Web Mobile).
> Chaque amélioration suit le même format : **Problème → Risque → Solution →
> Justification → Fichiers → Avant / Après**.
>
> **État du projet & vérifications :**
> - ✅ **Déployé en PRODUCTION** sur **https://glycibio.fr** (VPS OVH · Nginx + PM2 + MySQL) — tunnel de paiement **Stripe** + **webhooks** opérationnels (200 OK), e-mails transactionnels (SMTP OVH) actifs.
> - ✅ Tests automatisés : **47 tests au vert** (`node --test`) + tests d'**intégration MySQL réels** (commande / stock / paiement / livraison gratuite / remboursement) exécutés dans le job CI dédié.
> - ✅ Lint front : **0 erreur** (`cd client && npm run lint`) · Build front : **succès** · CI GitHub Actions verte.
> - ✅ Santé serveur : `/api/health` → `{"status":"OK","db":"up"}`.

---

## Tableau de synthèse

| # | Catégorie | Amélioration | Gravité corrigée |
|---|-----------|--------------|------------------|
| 1 | Sécurité paiement | Marquage « payée » rendu atomique (anti double-email) | HAUTE |
| 2 | Sécurité / stock | Fermeture de la voie de commande sans paiement | HAUTE |
| 3 | Sécurité | Jetons reset/vérif. e-mail hachés en base (SHA-256) | MOYENNE |
| 4 | Sécurité session | Vérification de fraîcheur de session *fail-closed* | FAIBLE |
| 5 | RGPD | E-mail panier abandonné soumis au consentement | FAIBLE |
| 6 | Robustesse | Validation de l'environnement au démarrage (*fail-fast*) | MOYENNE |
| 7 | Sécurité infra | Suppression des mots de passe BDD par défaut (Compose) | MOYENNE |
| 8 | Exploitation | Health checks profonds (ping BDD) + liveness/readiness | MOYENNE |
| 9 | Observabilité | Sentry : échec bruyant + configuration documentée | HAUTE |
| 10 | Sauvegarde | Automatisation des backups (systemd/cron) + hors-site | HAUTE |
| 11 | Tests | Suite de tests automatisés (43 tests) | CRITIQUE |
| 12 | CI/CD | Pipeline GitHub Actions (install/lint/build/test/audit) | HAUTE |
| 13 | Performance | Recherche debouncée + index FULLTEXT (MATCH) | HAUTE |
| 14 | Performance | Fin de la tempête de requêtes N+1 du panier invité | HAUTE |
| 15 | Performance | Cache navigateur des assets/images (nginx Docker) | FAIBLE |
| 16 | Qualité (DRY) | Source unique : seuils IG + constantes métier | MOYENNE |
| 17 | Cohérence | Récap panier aligné sur le paiement (livraison) | MOYENNE |
| 18 | Architecture | Extraction de logique pure (pricing, routage webhook) | MOYENNE |
| 19 | UX | Pagination « fenêtrée » (ellipses) | MOYENNE |
| 20 | SEO | Sitemap réellement servi en XML (proxy nginx) | HAUTE |
| 21 | SEO | Page 404 en `noindex` (fin des *soft 404*) | MOYENNE |
| 22 | Outillage | Config ESLint manquante ajoutée (`npm run lint` réparé) | MOYENNE |
| 23 | Commerce | Livraison gratuite réservée aux paniers ≥ 50 € (client + **enforcement serveur**) | MOYENNE |
| 24 | Commerce | Gestion des **remboursements** Stripe (`charge.refunded` → statut `remboursee` + stock) | MOYENNE |
| 25 | Fiabilité | E-mail de confirmation **découplé & idempotent** (survit à une panne SMTP, sans doublon) | MOYENNE |
| 26 | Sécurité | Invalidation de session au **changement de rôle** admin | MOYENNE |
| 27 | Robustesse | Migration de schéma **au démarrage** + handlers globaux `unhandledRejection`/`uncaughtException` | MOYENNE |
| 28 | Bug | Variantes d'images générées même pour un upload **déjà `.webp`** (plus de 404) | MOYENNE |
| 29 | Bug | Nginx `^~ /uploads/` (le regex images détournait les photos produits → 404) | MOYENNE |
| 30 | Robustesse | CSRF tolérant aux **cookies dupliqués** (transition Secure) + log de diagnostic | FAIBLE |
| 31 | UX | « Mes commandes » n'affiche que les commandes **payées** | FAIBLE |
| 32 | UX | Pré-remplissage adresse/téléphone au checkout (`/auth/me`) | FAIBLE |
| 33 | Qualité | Nettoyage du **code mort** (exports / fichiers / dépendances inutilisés) | FAIBLE |

---

## Mise en production & correctifs post-déploiement (2026-06-17)

Au-delà des 22 améliorations ci-dessus, le projet a été **mis en ligne** et durci lors d'une session de déploiement réelle (VPS OVH) :

- **Déploiement** : Node 20 + PM2 + Nginx (HTTPS / HSTS / CSP) + MySQL local. Les migrations additives (colonne `confirmation_email_sent`, valeur ENUM `remboursee`) s'appliquent **automatiquement au démarrage** (`ensureColumns`) — pas d'ALTER manuel.
- **Commerce** : règle de **livraison gratuite ≥ 50 €** vérifiée côté serveur (non contournable) ; **remboursements** Stripe (`charge.refunded`) ; e-mail de confirmation **idempotent** (verrou `confirmation_email_sent` — survit à un échec SMTP transitoire sans doublon).
- **Correctifs post-déploiement** (diagnostiqués via logs PM2 / tableau de bord Stripe) : traitement d'images robuste aux uploads `.webp` (lecture en Buffer), priorité Nginx `^~ /uploads/`, tolérance CSRF aux cookies dupliqués (transition dev→prod du flag `Secure`), `/auth/me` renvoyant `address`/`phone` (pré-remplissage), « Mes commandes » filtré sur les commandes payées.
- **Sécurité go-live** : mot de passe admin par défaut **changé**, clé Stripe **secrète** (`sk_test_…`, et non publiable `pk_`), SMTP OVH (`ssl0.ovh.net:465`) opérationnel.

> Historique complet : `git log` ; pièces techniques : dossier **`dossier/`** (modèle de données MCD/MLD, jeu d'essai, couverture OWASP Top 10).

---

## PHASE 1 — Correctifs critiques (sécurité, paiement, stock)

### 1. Marquage « payée » atomique — anti double e-mail de confirmation
- **Problème :** `markPaid` lisait le statut (`SELECT ... = 'en_attente'`) puis le mettait à jour dans une **2ᵉ requête séparée**. Le webhook Stripe et le retour navigateur `/payments/success` arrivent souvent **en même temps**.
- **Risque :** les deux appels lisent « en_attente » avant que l'un n'écrive → la commande est traitée deux fois → **deux e-mails de confirmation** (et doubles effets de bord) pour le même paiement.
- **Solution :** transition en **une seule requête** avec la garde `AND status = 'en_attente'`. On se sert de `affectedRows` comme verrou : seul le 1ᵉʳ appel obtient `affectedRows === 1`, les autres voient `0` et renvoient `null` → pas de second e-mail.
- **Justification :** une mise à jour conditionnelle SQL est **atomique au niveau de la ligne** (InnoDB), ce qui supprime la fenêtre de course sans verrou applicatif.
- **Fichier :** `server/src/repository/OrderRepository.js`
```js
// AVANT
const [orders] = await db.query("SELECT ... WHERE id = ? AND status = ?", [orderId, "en_attente"])
if (orders.length === 0) return null
await db.query("UPDATE orders SET status = 'payee', ... WHERE id = ?", [..., orderId])
return orders[0]

// APRÈS
const [result] = await db.query(
  "UPDATE orders SET status = 'payee', stripe_payment_id = ? WHERE id = ? AND status = 'en_attente'",
  [paymentIntentId || null, orderId]
)
if (result.affectedRows === 0) return null   // déjà traité par un appel concurrent
const [orders] = await db.query("SELECT ... FROM orders WHERE id = ?", [orderId])
return orders.length === 0 ? null : orders[0]
```

### 2. Fermeture de la voie de commande sans paiement
- **Problème :** `POST /api/orders` (`OrderController.createOrder`) décrémente le stock et vide le panier **sans aucun lien de paiement**. C'était prévu comme repli quand Stripe n'est pas configuré, mais rien n'empêchait un client authentifié de l'appeler **alors que Stripe est actif**.
- **Risque :** un utilisateur peut réserver/épuiser le stock en boucle sans jamais payer (**déni d'inventaire**), en contournant le tunnel Stripe.
- **Solution :** si Stripe **est configuré**, la route est refusée (409). Le repli reste disponible uniquement quand Stripe est absent (petite boutique sans paiement en ligne).
- **Justification :** on conserve la fonctionnalité de repli légitime tout en supprimant le vecteur d'abus en production. Le `cron/expiredCheckout` restaure de toute façon le stock des commandes en attente après 48 h.
- **Fichier :** `server/src/controller/OrderController.js`
```js
// APRÈS (ajout en tête de createOrder)
if (await StripeService.isConfigured()) {
  throw new ConflictException(
    "Le paiement en ligne est requis : utilisez le tunnel de paiement (create-checkout)."
  )
}
```

### 3. Jetons de réinitialisation / vérification e-mail hachés en base
- **Problème :** les jetons (reset mot de passe, vérification e-mail) étaient stockés **en clair** dans `users.reset_token` / `verification_token`.
- **Risque :** toute lecture de la table (dump, réplica, injection ailleurs) fournit des **jetons directement exploitables** → prise de contrôle de compte pendant la fenêtre de validité (1 h / 24 h).
- **Solution :** on ne stocke plus que l'**empreinte SHA-256** du jeton. Le jeton brut n'existe que dans l'e-mail. À la vérification, on hache l'entrée et on compare les empreintes.
- **Justification :** SHA-256 « nu » suffit ici car le jeton est déjà à **haute entropie** (`crypto.randomBytes(32)`), donc non bruteforçable — pas besoin d'un KDF lent (réservé aux mots de passe). Compatible `VARCHAR(64/255)` (hex = 64 car.), **aucune migration de schéma** nécessaire.
- **Fichier :** `server/src/repository/UserRepository.js`
```js
// AJOUT
const hashToken = (token) => crypto.createHash("sha256").update(String(token)).digest("hex")
// setResetToken / findByValidResetToken / setVerificationToken / findByValidVerificationToken
// passent désormais hashToken(token) au lieu du jeton brut.
```

### 4. Vérification de fraîcheur de session *fail-closed*
- **Problème :** après reset de mot de passe, `tokens_valid_after` invalide les anciens JWT. Mais si la requête de contrôle échouait (BDD indisponible), le middleware **acceptait quand même** le jeton (*fail-open*).
- **Risque :** un JWT volé pouvait survivre à la fenêtre de réinitialisation pendant un incident BDD.
- **Solution :** en cas d'erreur, on **refuse** désormais (401).
- **Justification :** compromis d'accessibilité acceptable — toute route authentifiée touche la BDD ; si elle est indisponible, la requête échouerait juste après de toute façon. La sécurité prime sur la disponibilité pour un contrôle de session.
- **Fichier :** `server/src/middleware/isAuthenticated.js`
```js
// AVANT : catch (e) { Logger.warn(...) }  -> next()  (accepte le jeton)
// APRÈS : catch (e) { Logger.error(...); return next(new UnauthorizedException(...)) }
```

### 5. E-mail « panier abandonné » conforme RGPD
- **Problème :** le cron envoyait un rappel marketing à **tous** les utilisateurs, sans vérifier `newsletter_opt_in`.
- **Risque :** sollicitation commerciale sans consentement = non-conformité **RGPD / ePrivacy** (risque légal et réputationnel en France).
- **Solution :** ajout de `AND u.newsletter_opt_in = 1` à la requête de détection.
- **Fichier :** `server/src/cron/abandonedCart.js`

### 6. Validation de l'environnement au démarrage (*fail-fast*)
- **Problème :** une configuration invalide (`JWT_SECRET` manquant/trop court, variables BDD absentes) ne se manifestait que par des **erreurs 500 silencieuses** en production.
- **Risque :** mise en service avec un secret faible → JWT bruteforçables ; ou app qui « démarre » mais 500 sur chaque requête.
- **Solution :** module `core/env.js` qui valide l'environnement **avant** la création du pool MySQL et **coupe le démarrage** (exit 1) en cas d'erreur fatale.
- **Justification :** transforme une mauvaise config silencieuse en erreur immédiate et explicite. Fonction `validateEnv(env)` **pure** → testée unitairement (8 cas).
- **Fichiers :** `server/src/core/env.js` (nouveau), `server/src/server.js`
```js
// server.js (avant la création du pool via App.js)
const { assertEnv } = await import("./core/env.js")
assertEnv(Logger)   // exit 1 si JWT_SECRET < 32 car., vars BDD manquantes, etc.
```

### 7. Suppression des mots de passe BDD par défaut (Docker Compose)
- **Problème :** `${DB_PASSWORD:-glycibio_app_pwd}` et `${DB_ROOT_PASSWORD:-root_password}` démarraient MySQL avec des **mots de passe publics connus** si le `.env` était incomplet.
- **Risque :** base de données exposée avec des identifiants devinables (le port BDD est publié sur l'hôte).
- **Solution :** forme `${VAR:?message}` → **Compose échoue** si la variable est absente.
- **Fichier :** `docker/docker-compose.yml`

---

## PHASE 2 — Mise en production

### 8. Health checks profonds (liveness + readiness)
- **Problème :** `/health` renvoyait 200 même MySQL coupé → l'orchestrateur (Docker, uptime monitor) croyait l'API saine alors que toutes les requêtes data échouaient.
- **Solution :** `/health` (et `/health/ready`) **pingue la BDD** (`SELECT 1`) et renvoie **503** si elle est injoignable ; `/health/live` reste un check de process pur.
- **Fichier :** `server/src/router/index.js`

### 9. Sentry : fin du faux sentiment de monitoring
- **Problème :** `errorHandler` appelait `Sentry.captureException`, mais `@sentry/node` n'était pas une dépendance → l'import échouait en silence (warn) → **les 500 n'étaient envoyés nulle part**.
- **Solution :** en **production**, si `SENTRY_DSN` est défini mais le paquet absent, on logge une **ERREUR** (pas un warn) ; activation documentée en 2 étapes (`npm install @sentry/node` + DSN) dans les `.env.example` et passée via Docker Compose. `core/env.js` avertit aussi si `SENTRY_DSN` est absent en production.
- **Fichiers :** `server/src/services/Sentry.js`, `server/.env.example`, `client/.env.example`, `docker/docker-compose.yml`
- **Bonus sécurité :** `server.js` détecte au démarrage si le **compte admin d'usine** (hash bcrypt connu) est encore présent et logge un avertissement.

### 10. Sauvegardes automatisées + hors-site
- **Problème :** l'excellent script `backup-db.cjs` n'était que **documenté** (suggestion de cron), stockait en local sur le même disque que la BDD, sans test de restauration.
- **Solution :** unités **systemd** (`.service` + `.timer` quotidien 03 h, `Persistent=true`) **versionnées** + alternative cron, avec emplacement pour la **copie hors-site** (rclone/scp) en commentaire prêt à activer.
- **Fichiers :** `deploy/systemd/glycibio-backup.{service,timer}`, `deploy/cron/glycibio-backup.cron`

---

## PHASE 3 — Tests automatisés (le manque le plus critique)

- **Problème :** **zéro test** sur une application qui manipule de l'argent (Stripe), du stock transactionnel et de l'authentification. Les scripts `npm test` / `test:api` pointaient vers des fichiers **inexistants**.
- **Solution :** suite **`node:test`** (runner intégré à Node, **aucune dépendance ajoutée** → tourne tel quel en CI), **43 tests** couvrant les priorités demandées :
  1. **Authentification** : `authHelper.test.js` (signature/vérif JWT, rejet jeton falsifié/mauvais secret, cookie HttpOnly).
  2. **Commandes** : `orderPricing.test.js` (calcul des montants, arrondi centime, lignes invalides).
  3. **Webhook Stripe** : `webhookRouting.test.js` (paid → markPaid, expired/failed → restauration stock, idempotence/robustesse).
  4. **Validation & upload** : `validator.test.js`, `fileSignature.test.js` (rejet SVG/PDF), `slug.test.js`, `env.test.js`.
- **Justification :** les flux critiques étaient non testables car la logique vivait dans des couches à E/S. On a **extrait des fonctions pures** (`OrderPricing`, `WebhookEvents`) testables sans BDD ni Stripe — bénéfice double (architecture + tests).
- **Fichiers :** `server/tests/*.test.js`, `server/src/services/{OrderPricing,WebhookEvents}.js`, `server/package.json` (scripts réparés)
```text
$ npm test               # sans BDD : 43 tests unitaires (integration ignoree)
ℹ tests 43  ℹ pass 43  ℹ fail 0
```

### PHASE 3-bis — Tests d'INTÉGRATION (base MySQL réelle)
- **Problème :** les tests unitaires valident la logique pure, mais pas le comportement **transactionnel réel** (verrous `FOR UPDATE`, triggers, contraintes, rollback) — le cœur du risque pour le paiement et le stock.
- **Solution :** suite d'intégration (`server/tests/order.integration.test.js`) qui exécute le **vrai code des repositories** contre une **vraie MySQL**, couvrant :
  1. `createPendingFromCart` → stock décrémenté, total calculé, panier vidé ;
  2. stock insuffisant → rejet **+ rollback** (stock inchangé) ;
  3. `markPaid` → transition **atomique exactly-once** (le 2ᵉ appel concurrent renvoie `null`) ;
  4. `cancelPendingAndRestoreStock` → stock restauré, **idempotent**.
- **Sécurité d'exécution :** les tests **s'auto-ignorent** si `TEST_DB_*` n'est pas défini (ils ne touchent JAMAIS la base de dev par accident, et `npm test` reste vert). Un **job CI dédié** lance un service MySQL 8, charge le schéma, puis exécute la suite (`TEST_DB_*` renseignés).
- **Justification :** prouve concrètement au jury que « les paiements/stocks sont protégés contre la régression » — la garantie la plus crédible pour une boutique e-commerce.
- **Fichiers :** `server/tests/order.integration.test.js`, `.github/workflows/ci.yml` (job `integration`)
```text
# avec une BDD de test (vérifié localement contre MySQL Docker)
$ TEST_DB_* ... npm test
✔ createPendingFromCart : decremente le stock, calcule le total, vide le panier
✔ createPendingFromCart : stock insuffisant -> rejet, stock inchange (rollback)
✔ markPaid : transition atomique exactly-once (anti double traitement)
✔ cancelPendingAndRestoreStock : restaure le stock, idempotent
ℹ tests 47  ℹ pass 47  ℹ fail 0  ℹ skipped 0
```

---

## PHASE 4 — Intégration continue (CI/CD)

- **Problème :** aucun pipeline (`.github` absent) → chaque modification atteignait la prod sans aucun garde-fou automatique.
- **Solution :** `.github/workflows/ci.yml` avec 2 jobs parallèles :
  - **server** : `npm ci` → `npm test` → `npm audit --omit=dev --audit-level=high`
  - **client** : `npm ci --legacy-peer-deps` → `npm run lint` → `npm run build` → audit
- **Justification :** install + lint + build + tests + audit sécurité, déclenché sur push/PR vers `main`, avec cache npm et annulation des runs obsolètes.
- **Fichier :** `.github/workflows/ci.yml`

---

## PHASE 5 — Performance

### 13. Recherche catalogue : debounce + index FULLTEXT
- **Problème :** chaque frappe dans la recherche/prix déclenchait **une requête API** + un `LIKE '%terme%'` **non indexable** (scan complet de table, ×2 avec le COUNT).
- **Solution (front) :** hook `useDebouncedValue` → la requête ne part qu'après une pause de saisie (RTK Query dédoublonne).
  **Solution (back) :** `MATCH(p.name, p.description) AGAINST (? IN BOOLEAN MODE)` exploite l'index `FULLTEXT idx_products_search` déjà présent ; repli `LIKE` pour les termes < 3 car. ; opérateurs booléens neutralisés (anti-injection d'opérateur).
- **Fichiers :** `client/src/hooks/useDebouncedValue.js` (nouveau), `client/src/pages/Catalog/index.jsx`, `server/src/repository/ProductRepository.js`

### 14. Panier invité : fin des requêtes N+1
- **Problème :** chaque `+`/`−`/suppression re-récupérait **tous** les produits du panier (`forceRefetch`), soit N requêtes à chaque clic.
- **Solution :** option `refresh` → on rafraîchit prix/stock **au montage uniquement** ; les mutations réutilisent les *snapshots* déjà stockés (zéro réseau).
- **Fichier :** `client/src/pages/Cart/index.jsx`

### 15. Cache navigateur (nginx Docker)
- **Problème :** la conf Docker servait `/uploads` et les assets sans en-têtes de cache (contrairement à la conf OVH).
- **Solution :** `Cache-Control immutable` 1 an pour `/assets` et `/fonts`, `no-cache` pour `index.html`, `public 30 j` pour `/uploads`.
- **Fichier :** `docker/nginx.conf`

---

## PHASE 6 — Qualité de code (SOLID / DRY / KISS)

### 16. Source unique : seuils IG + constantes métier
- **Problème :** la logique IG (`<=55 / <=69`) et ses libellés étaient **dupliqués et divergents** dans 5 fichiers (`MODÉRÉ` vs `IG moyen` vs `Modéré`…) ; le seuil de livraison gratuite `49` était codé en dur dans le panier **et** en chaîne `"49"` dans la navbar.
- **Solution :** modules `Utils/ig.js` (seuils + libellés + `igLevelOf`) et `Utils/constants.js` (`FREE_SHIPPING_THRESHOLD`, `VAT_RATE`), consommés par `IgMeter` et `Cart`.
- **Fichiers :** `client/src/Utils/ig.js`, `client/src/Utils/constants.js`, `client/src/components/IgMeter/index.jsx`, `client/src/pages/Cart/index.jsx`

### 17. Récap panier cohérent avec le paiement
- **Problème :** le panier affichait **toujours** « Livraison : Offerte », alors que le Checkout facture réellement le port.
- **Solution :** « Offerte » uniquement si sous-total ≥ seuil, sinon « Calculée à l'étape suivante ». Suppression de l'emoji `👏` (violait la règle « pas d'emoji icône » de `DESIGN.md`).
- **Fichier :** `client/src/pages/Cart/index.jsx`

### 18. Extraction de logique pure (amorce de couche service)
- **Problème :** le calcul des montants vivait dans le repository, le routage des webhooks dans le contrôleur → non réutilisables, non testables.
- **Solution :** `services/OrderPricing.js` (calcul des totaux) et `services/WebhookEvents.js` (mapping événement → action) — **purs** et testés.
- **Fichiers :** `server/src/services/OrderPricing.js`, `server/src/services/WebhookEvents.js`, `OrderRepository.js`, `WebhookController.js`

### 19. Pagination « fenêtrée »
- **Problème :** un bouton par page (1..N) → bande inutilisable sur gros catalogue.
- **Solution :** `1 … 4 [5] 6 … 20` (fenêtre + ellipses), DOM borné.
- **Fichier :** `client/src/components/Pagination/index.jsx`

---

## PHASE 7 — SEO

### 20. Sitemap réellement servi en XML
- **Problème :** `robots.txt` annonce `/sitemap.xml`, mais les **deux** confs nginx (Docker **et** OVH) ne proxyaient pas cette route → le *fallback* SPA renvoyait `index.html` (HTML) au lieu du XML.
- **Solution :** `location = /sitemap.xml { proxy_pass ... }` vers l'API Express dans les deux confs.
- **Fichiers :** `docker/nginx.conf`, `deploy/nginx/glycibio.conf`

### 21. Page 404 en `noindex`
- **Problème :** le SPA renvoie 200 pour les URL inconnues, et `NotFound` héritait des méta de la page d'accueil → *soft 404* indexés.
- **Solution :** `useDocumentMeta({ noIndex: true })` sur la 404.
- **Fichier :** `client/src/pages/NotFound/index.jsx`

### 22. Configuration ESLint manquante
- **Problème :** `npm run lint` échouait (aucun `eslint.config.js`), comme les scripts de test cassés.
- **Solution :** config « flat » ESLint 9 (React 19 + hooks + refresh) — `npm run lint` passe désormais à **0 erreur**.
- **Fichier :** `client/eslint.config.js` (nouveau)

---

## PHASE 9 — Sécurité CSRF & architecture RTK Query

### 23. Protection CSRF (double-submit cookie)
- **Problème :** l'authentification reposait UNIQUEMENT sur le cookie + `SameSite=lax`, sans jeton anti-CSRF, et `COOKIE_SAMESITE` pouvait être affaibli à `none`.
- **Risque :** falsification de requête inter-site (CSRF) sur les routes mutantes (ajout panier, création commande, changement de mot de passe, suppression de compte) si SameSite était contourné/désactivé.
- **Solution :** patron **double-submit** — le serveur dépose un jeton aléatoire dans un cookie **lisible par le JS** (`csrf_token`), le front le renvoie dans l'en-tête `X-CSRF-Token`, le serveur exige `header === cookie` (comparaison à temps constant) sur POST/PUT/PATCH/DELETE. Le webhook Stripe est exclu (déjà protégé par signature). En complément, `COOKIE_SAMESITE` est **clampé** (`none` refusé → `lax`).
- **Justification :** un site attaquant ne peut NI lire le cookie CSRF de la victime (same-origin) NI poser l'en-tête custom cross-origin → il ne peut pas faire correspondre header et cookie. Défense en profondeur du SameSite.
- **Fichiers :** `server/src/middleware/csrf.js` (nouveau), `server/src/App.js`, `server/src/services/AuthHelper.js`, `client/src/store/apiSlice/baseQuery.js`
- **Vérifié (serveur réel) :**
```text
1) GET /api/health        -> 200, cookie csrf_token émis
2) POST /login SANS header -> 403 (bloqué)
3) POST /login AVEC header -> 401 (CSRF passé, atteint l'auth)
```

### 24. Consolidation RTK Query : 11 `createApi` → 1 API unique
- **Problème :** 11 instances `createApi` séparées → l'invalidation par tags ne traversait pas les instances ; d'où une « god-slice » admin de 216 lignes pour contourner, et l'impossibilité d'invalider le cache produit public depuis une mutation.
- **Solution :** une **API unique** (`baseApi`) ; chaque domaine **injecte** ses endpoints via `baseApi.injectEndpoints(...)`. `store.js` passe de 11 reducers/middlewares à **un seul**. Les hooks sont ré-exportés à l'identique → **zéro changement dans les composants** (63 endpoints vérifiés injectés au runtime).
- **Bénéfice concret :** au login/logout, `useAuthenticated` invalide désormais **cibléement** les tags inter-domaines (`cart`, `wishlist`, `profile`, `orders`) au lieu de réinitialiser des caches entiers domaine par domaine — et `setupListeners` est branché (refetch on focus/reconnect).
- **Justification :** c'est le patron recommandé par l'équipe RTK ; il rétablit la cohérence de cache inter-domaines et supprime un dette d'architecture.
- **Fichiers :** `client/src/store/apiSlice/baseApi.js` (nouveau), les 11 `*ApiSlice.js`, `client/src/store/store.js`, `client/src/hooks/useAuthenticated.js`
- **Vérifié :** `npm run lint` = 0 erreur · `npm run build` = succès · smoke runtime = **63 endpoints** sur une seule API (`reducerPath: "api"`).
