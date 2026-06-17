# GlyciBio — Jeu d'essai

> Pièce du dossier DWWM (obligatoire) : jeux d'essai *données d'entrée → résultat
> attendu → résultat obtenu*. Statut **✅ Conforme**. Les cas marqués 🤖 sont
> **automatisés** (CI : `node --test` unitaire + intégration MySQL réelle ;
> `eslint` ; `vite build`). Réf. : `server/tests/`, `.github/workflows/ci.yml`.

## 1. Authentification & comptes

| N° | Cas | Données d'entrée | Résultat attendu | Obtenu |
|---|---|---|---|---|
| A1 | Inscription valide | email valide + mdp `JuryTest123!@#` + nom | 201, compte créé, cookie `token` HttpOnly posé | ✅ |
| A2 | Inscription email déjà utilisé | email existant | 409 « Cet email est déjà utilisé » | ✅ |
| A3 | Mot de passe trop faible | mdp `azerty` | 400, message politique (≥12 car. maj/min/chiffre/spécial) | ✅ |
| A4 🤖 | Politique de mot de passe | divers | `isPasswordValid` accepte/rejette correctement | ✅ |
| A5 | Connexion valide | bons identifiants | 200, cookie d'auth, accès à l'espace client | ✅ |
| A6 | Connexion mauvais mdp | mdp erroné | 401 « Email ou mot de passe incorrect » (message générique) | ✅ |
| A7 | Verrouillage anti-brute-force | 5 échecs consécutifs | compte verrouillé 15 min (429) | ✅ |
| A8 🤖 | Jeton JWT | aller-retour sign/verify | id+rôle conservés ; jeton falsifié/autre secret rejeté | ✅ |
| A9 | Réinitialisation mdp | email existant | email envoyé, jeton **haché** à expiration, anti-énumération | ✅ |

## 2. Catalogue & recherche

| N° | Cas | Données d'entrée | Résultat attendu | Obtenu |
|---|---|---|---|---|
| C1 | Liste produits | GET /api/products | 200, 25 produits paginés | ✅ |
| C2 | Filtre par catégorie / IG / prix | paramètres query | produits filtrés/triés (ORDER BY liste blanche) | ✅ |
| C3 | Recherche plein-texte | mot-clé | résultats FULLTEXT (name, description) | ✅ |
| C4 | Fiche produit (slug) | /produit/&lt;slug&gt; | 200, détail + IG + galerie | ✅ |
| C5 🤖 | Slug unique | nom produit | slug minuscules/accents retirés + suffixe id | ✅ |

## 3. Panier & commande

| N° | Cas | Données d'entrée | Résultat attendu | Obtenu |
|---|---|---|---|---|
| P1 | Ajout au panier | product_id + quantité | 201, ligne créée (1 par produit, `UNIQUE`) | ✅ |
| P2 🤖 | Création commande + stock | panier de 3 unités (stock 10) | stock = 7, sous-total = 15 €, panier conservé | ✅ |
| P3 🤖 | Stock insuffisant | quantité > stock | rejet « Stock insuffisant », **stock inchangé** (rollback transaction) | ✅ |
| P4 🤖 | Marquage payé idempotent | 2 appels `markPaid` concurrents | 1er gagne, 2e no-op (un seul email, panier vidé une fois) | ✅ |
| P5 🤖 | Re-checkout | 2e tunnel sur panier non payé | 1re commande annulée + stock restauré (pas de double réservation) | ✅ |
| P6 | Prix non falsifiable | prix injecté dans la requête | ignoré : prix **recalculé serveur** depuis la BDD | ✅ |
| P7 | Annulation commande | commande `en_attente` | statut `annulee` + **stock restauré** | ✅ |

## 4. Livraison gratuite (règle métier)

| N° | Cas | Données d'entrée | Résultat attendu | Obtenu |
|---|---|---|---|---|
| L1 🤖 | Gratuit sous le seuil | sous-total 10 € + méthode « Gratuit » | **rejet serveur**, stock inchangé | ✅ |
| L2 🤖 | Gratuit au seuil | sous-total 50 € + méthode « Gratuit » | accepté, livraison 0 €, total 50 € | ✅ |
| L3 | UI sous le seuil | panier < 50 € à l'écran Checkout | option « Gratuit » **désactivée** + note « Dès 50 € d'achat » | ✅ |

## 5. Paiement (Stripe)

| N° | Cas | Données d'entrée | Résultat attendu | Obtenu |
|---|---|---|---|---|
| S1 | Tunnel Stripe | checkout carte test `4242 4242 4242 4242` | redirection Stripe → retour → commande `payee` | ✅ |
| S2 🤖 | Webhook payé | `checkout.session.completed` payé | `markPaid` (commande `payee`) | ✅ |
| S3 🤖 | Webhook expiré / échec | `expired` / `payment_failed` | `cancelRestoreStock` (stock restauré) | ✅ |
| S4 🤖 | Webhook remboursement total | `charge.refunded` | statut `remboursee` (+ stock si non expédiée) | ✅ |
| S5 | Webhook non signé (prod) | requête forgée sans signature | **rejet 503** (aucune commande validée) | ✅ |
| S6 | Repli sans Stripe | Stripe non configuré | commande créée via `/api/orders` (panier vidé) | ✅ |

## 6. Avis & back-office admin

| N° | Cas | Données d'entrée | Résultat attendu | Obtenu |
|---|---|---|---|---|
| R1 | Dépôt d'avis | note 1..5 + commentaire | avis créé en statut `pending` (modération) | ✅ |
| R2 | 1 avis par produit | 2e avis même client/produit | rejet (`UNIQUE user_id, product_id`) | ✅ |
| AD1 | Accès admin sans rôle | client sur `/api/admin/*` | 403 Forbidden | ✅ |
| AD2 | CRUD produit + image | upload image | produit créé, image WebP + variantes responsives générées | ✅ |
| AD3 | Changement statut commande | admin → `remboursee` | statut mis à jour + stock restauré (si `payee`) | ✅ |
| AD4 | Auto-protection admin | admin modifie son propre rôle | refus | ✅ |

## 7. Sécurité (tests négatifs)

| N° | Cas | Données d'entrée | Résultat attendu | Obtenu |
|---|---|---|---|---|
| SE1 | Injection SQL | `' OR 1=1 --` dans un champ | neutralisé (requêtes paramétrées) — aucune fuite | ✅ |
| SE2 | XSS stocké | `<script>` dans un avis/nom | échappé au rendu (React), non exécuté | ✅ |
| SE3 | CSRF | requête mutante sans en-tête `X-CSRF-Token` | 403 « Jeton CSRF manquant » | ✅ |
| SE4 🤖 | Upload non-image | fichier texte renommé `.webp` | rejeté (vérification *magic bytes*) | ✅ |
| SE5 | Route directe SPA | `/produit/1` en accès direct | 200 (fallback `index.html`, pas de 404) | ✅ |

## 8. Emails (transactionnels)

| N° | Cas | Données d'entrée | Résultat attendu | Obtenu |
|---|---|---|---|---|
| E1 | Email de confirmation | commande payée | email envoyé une seule fois (verrou `confirmation_email_sent`) | ✅ |
| E2 | SMTP indisponible | panne SMTP transitoire | échec **non bloquant** + nouvelle tentative (pas de doublon) | ✅ |

---

### Synthèse CI (preuve d'exécution automatisée)

```
node --test  →  57 tests, 47 passés, 0 échec
                (10 ignorés hors CI = tests d'intégration MySQL, exécutés dans le job CI dédié)
eslint .     →  0 erreur
vite build   →  build de production OK
```

> Les cas non automatisés (UI, tunnel Stripe réel) sont vérifiés **manuellement**
> lors de la démonstration sur `https://glycibio.fr` (parcours d'achat avec carte
> de test Stripe `4242 4242 4242 4242`).
