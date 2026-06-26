# Déploiement GlyciBio — runbook

Configuration de référence et script de déploiement pour le VPS OVH
(`glycibio.fr` · Ubuntu · Nginx + PM2 + MySQL local, front et API **same-origin**).

| Fichier | Rôle |
|---|---|
| [`deploy.sh`](deploy.sh) | Script de **mise à jour / re-déploiement** (à lancer sur le serveur) |
| [`nginx/glycibio.conf`](nginx/glycibio.conf) | Bloc serveur Nginx (HTTP/2 + **CSP** + en-têtes de sécurité + cache) |

> La **première installation** (provisionnement du VPS, MySQL, certbot, DNS, pare-feu)
> est décrite pas à pas dans `docs/DEPLOYMENT-OVH.md` (hors dépôt). Ce runbook couvre
> les **déploiements suivants** après un merge sur `main`.

---

## Pré-requis (une seule fois)

1. VPS déjà provisionné selon `DEPLOYMENT-OVH.md` (Node 20, Nginx, MySQL, PM2, certbot).
2. Le dépôt cloné sur le serveur (ex. `~/glycibio`) avec `origin` pointant vers
   **le bon dépôt** :
   ```bash
   cd ~/glycibio
   git remote -v        # doit afficher .../shaabanalabdi/glycibio-clean.git
   # si ce n'est pas le cas :
   git remote set-url origin https://github.com/shaabanalabdi/glycibio-clean.git
   ```
   > ⚠️ Le guide OVH initial clonait `shaabanalabdi/Glycibio.git` ; **le code de
   > production vit désormais sur `glycibio-clean`**. Le script vérifie ce point et
   > prévient si `origin` est incorrect.
3. `server/.env` et `client/.env` présents sur le serveur (non versionnés).

---

## Déployer une mise à jour

Sur le serveur, depuis la racine du dépôt :

```bash
cd ~/glycibio
git pull                 # récupère deploy.sh à jour la 1re fois
bash deploy/deploy.sh
```

Le script enchaîne (et **échoue vite** en cas de problème) :

1. `git fetch` + `checkout main` + `pull --ff-only` (refuse d'écraser des commits locaux).
2. **Build du front** (`client`) → `client/dist/` (`VITE_API_URL=/api`).
3. **Deps API** de production (`server`, `npm ci --omit=dev`).
4. **Config Nginx** (optionnel, demandé interactivement) : copie `nginx/glycibio.conf`,
   lance `nginx -t`, **recharge si OK**, sinon **restaure** l'ancienne config.
5. **Reload PM2** (`glycibio-api`, zéro downtime, relit `server/.env`).
6. Vérifie `GET /api/health`.

### Options (non interactif)

```bash
APPLY_NGINX=yes bash deploy/deploy.sh      # applique la config Nginx sans demander
APPLY_NGINX=no  bash deploy/deploy.sh      # ne touche pas à Nginx
DEPLOY_BRANCH=main PM2_APP=glycibio-api bash deploy/deploy.sh
```

> **Note CSP :** `nginx/glycibio.conf` contient une `Content-Security-Policy` avec le
> **hash SHA-256** du script inline (bootstrap du thème) de `client/index.html`. Si ce
> script change, régénérer le hash (voir le commentaire en tête du fichier nginx) **avant**
> d'appliquer la config, sinon le thème serait bloqué.

---

## Après le déploiement — go-live (une seule fois)

- [ ] **Mot de passe admin** : le seed contient un hash bcrypt **public**. Le changer :
  ```sql
  -- générer : PW='...' node -e "console.log(require('bcrypt').hashSync(process.env.PW,12))"
  UPDATE users SET password='<hash>' WHERE email='admin@glycibio.fr';
  ```
- [ ] **Secrets** `server/.env` : `JWT_SECRET` via
  `openssl rand -base64 48` ; clés **Stripe LIVE** ; SMTP (`noreply@glycibio.fr`).
- [ ] **Webhook Stripe** → `https://glycibio.fr/api/webhooks/stripe`
  (events : `checkout.session.completed/expired/async_payment_failed`,
  `payment_intent.payment_failed/canceled`, `charge.refunded`) → copier le `whsec_…` dans `.env` →
  `pm2 reload glycibio-api --update-env`.
- [ ] **Vérifs externes** : [SSL Labs](https://www.ssllabs.com/ssltest/),
  [securityheaders.com](https://securityheaders.com) (CSP/HSTS), parcours d'achat test
  `4242 4242 4242 4242`.

---

## Rollback rapide

```bash
cd ~/glycibio
git log --oneline -5                      # repérer le commit précédent
git checkout <commit_precedent>
cd client && npm ci --legacy-peer-deps && npm run build
cd ../server && npm ci --omit=dev && pm2 reload glycibio-api --update-env
# Nginx : restaurer une sauvegarde générée par le script
sudo cp /etc/nginx/sites-available/glycibio.bak-<timestamp> /etc/nginx/sites-available/glycibio
sudo nginx -t && sudo systemctl reload nginx
```

> La **sauvegarde automatisée OVH** (snapshot disque quotidien) reste le filet de
> sécurité de dernier recours ; les dumps `npm run backup:db` couvrent la base.
