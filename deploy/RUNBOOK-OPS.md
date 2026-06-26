# GlyciBio — Runbook d'exploitation (Ops / SRE)

> Procédures de production : réponse aux incidents, reprise après sinistre,
> rotation des secrets, renouvellement SSL, supervision. Cible : VPS OVH
> (Ubuntu) — Nginx + PM2 + MySQL local. Compagnon de [`deploy/README.md`](README.md).

## 0. Informations clés

| Élément | Valeur |
|---|---|
| URL production | https://glycibio.fr |
| Process applicatif | PM2 `glycibio-api` (fork) |
| Santé | `GET /api/health` → `{"status":"OK","db":"up"}` (503 si MySQL down) |
| Racine app (VPS) | `/home/glycibio/glycibio` |
| Base de données | MySQL local `glycibio` (user `glycibio_app`) |
| Secrets | `server/.env` (JWT_SECRET, DB_PASSWORD, SMTP_PASS, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET) |
| Sauvegardes | `server/backups/*.sql.gz` (rétention 14 j) — `npm run backup:db` / timer `glycibio-backup.timer` |
| Déploiement | `cd ~/glycibio && bash deploy/deploy.sh` |
| Logs | `pm2 logs glycibio-api` (JSON structuré en prod) |

---

## 1. Réponse aux incidents

> Réflexe : 1) constater (health + logs), 2) isoler la cause, 3) corriger, 4) vérifier, 5) noter.

### 1.1 API en erreur (5xx) / site KO
```bash
curl -s -o /dev/null -w "%{http_code}\n" https://glycibio.fr/api/health   # 200 attendu
pm2 status glycibio-api                 # online ? nb de restarts ?
pm2 logs glycibio-api --lines 80 --nostream   # cause (stacktrace, ECONN…)
```
- **App crashée / boucle de restart** → `pm2 restart glycibio-api --update-env` ; si échec au boot, lire le log (souvent `.env` invalide — `assertEnv` fatal).
- **`db:"down"`** → voir 1.2.
- **Nginx** : `sudo nginx -t && sudo systemctl reload nginx` ; logs `sudo tail -50 /var/log/nginx/error.log`.
- **RTO cible** : < 15 min.

### 1.2 MySQL indisponible
```bash
sudo systemctl status mysql
sudo systemctl restart mysql
sudo journalctl -u mysql -n 100 --no-pager     # OOM ? disque plein ?
df -h                                           # disque saturé = cause fréquente
```
- Disque plein → purger vieux logs/backups, puis restart. Si corruption → **restaurer** (§2.3).

### 1.3 Certificat SSL expiré
Symptôme : avertissement navigateur. Voir §4 (renouvellement + secours manuel).

### 1.4 Trafic anormal / abus
```bash
pm2 logs glycibio-api --lines 200 --nostream | grep -i "429\|csrf\|locked"
sudo tail -200 /var/log/nginx/access.log | awk '{print $1}' | sort | uniq -c | sort -rn | head
```
- Rate-limiting applicatif (4 zones : global 300/min, login 5/min, contact 5/h, admin 200/min) actif. Pic depuis une IP → bloquer au pare-feu : `sudo ufw deny from <IP>`.

### 1.5 Perte du VPS (sinistre majeur)
Voir §2.4 (reconstruction complète depuis snapshot + sauvegarde hors-site).

---

## 2. Sauvegardes & reprise après sinistre (DR)

### 2.1 Sauvegarde locale (en place)
- Script : `server/scripts/backup-db.cjs` (`mysqldump --single-transaction` → `.sql.gz`, rétention 14 j).
- Manuel : `cd ~/glycibio/server && npm run backup:db`
- Planifié (systemd) :
  ```bash
  sudo cp deploy/systemd/glycibio-backup.* /etc/systemd/system/
  sudo systemctl daemon-reload && sudo systemctl enable --now glycibio-backup.timer
  systemctl list-timers glycibio-backup.timer
  ```

### 2.2 🔴 Copie HORS-SITE (À ACTIVER — sinon perte de disque = perte totale)
Les sauvegardes locales sont sur **le même disque** que la BDD → aucune protection contre une panne disque/VPS. **Activer une réplication distante** (ex. OVH Object Storage) :
```bash
# 1) Installer + configurer rclone (une fois)
sudo apt install -y rclone
rclone config        # créer un remote "ovh" type S3 (OVH Object Storage, région GRA)

# 2) Activer la copie post-sauvegarde dans le service systemd
#    (décommenter la ligne ExecStartPost rclone de glycibio-backup.service)
sudo systemctl edit --full glycibio-backup.service
#    ExecStartPost=/usr/bin/rclone copy /home/glycibio/glycibio/server/backups ovh:glycibio-backups --max-age 25h
sudo systemctl daemon-reload

# 3) Tester
sudo systemctl start glycibio-backup.service
rclone ls ovh:glycibio-backups        # le dernier dump doit apparaître
```
**Alerte fraîcheur** : surveiller qu'un dump < 48 h existe (sinon investiguer).

### 2.3 Restauration de la base
```bash
cd ~/glycibio/server/backups
ls -lt *.sql.gz | head                      # choisir le dump
# (hors-site : rclone copy ovh:glycibio-backups ./ --max-age 24h)
gunzip -c glycibio_YYYY-MM-DD_HHMM.sql.gz | sudo mysql glycibio
pm2 restart glycibio-api --update-env
curl -s https://glycibio.fr/api/health
```

### 2.4 Reconstruction complète (perte VPS)
1. Restaurer le **snapshot OVH** (ou provisionner un VPS + suivre `docs/DEPLOYMENT-OVH.md`).
2. `git clone` + `bash deploy/deploy.sh` + recréer `server/.env`.
3. Charger le schéma puis **restaurer le dernier dump hors-site** (§2.3).
4. Vérifier : health, login, parcours commande, webhook Stripe.

**RPO** (perte de données max) : 24 h (sauvegarde quotidienne) → viser 6 h si volume élevé.
**RTO** (temps de remise en service) : ~1–2 h depuis snapshot + dump.
**Test trimestriel obligatoire** : restaurer un dump sur une base jetable et vérifier l'intégrité (`SELECT COUNT(*)` produits/commandes).

---

## 3. Rotation des secrets

> Cadence recommandée : **trimestrielle**, et **immédiate** en cas de fuite (ex. secret partagé par erreur).

| Secret | Procédure | Impact |
|---|---|---|
| **JWT_SECRET** | générer `openssl rand -base64 48` → `.env` → `pm2 reload glycibio-api --update-env` | **déconnecte toutes les sessions** (re-login). Faire en heures creuses. |
| **DB_PASSWORD** | `ALTER USER 'glycibio_app'@'localhost' IDENTIFIED BY '<hex>'` puis `.env` + reload (voir guide dédié) | bref risque de coupure si `.env` non mis à jour aussitôt |
| **SMTP_PASS** | régénérer dans l'espace OVH mail → `.env` (entre guillemets si caractères spéciaux) + reload | e-mails en échec tant que non synchronisé |
| **STRIPE_SECRET_KEY / WEBHOOK_SECRET** | roll dans le dashboard Stripe (clés versionnées) → `.env` + reload ; mettre à jour l'endpoint webhook | paiements/webhooks KO si désynchronisé |

Après rotation : `curl /api/health`, test login, test paiement `4242…`, vérifier réception webhook (dashboard Stripe = 200).

---

## 4. Renouvellement SSL/TLS (Let's Encrypt / certbot)

```bash
sudo certbot certificates                    # date d'expiration
systemctl list-timers | grep certbot         # le timer de renouvellement doit exister
sudo certbot renew --dry-run                 # valider le renouvellement auto
```
- Le renouvellement est **automatique** via le timer `certbot.timer` (vérifier `systemctl enable --now certbot.timer`).
- **Secours manuel** si échec : `sudo certbot renew --force-renewal && sudo systemctl reload nginx`.
- **Surveillance** : vérification mensuelle [SSL Labs](https://www.ssllabs.com/ssltest/) (note A attendue) ; certbot peut envoyer un e-mail d'alerte d'expiration (configurer l'e-mail au `certbot`).

---

## 5. Supervision & alerting

### 5.1 Uptime externe (à brancher)
Configurer un moniteur (ex. **UptimeRobot**, gratuit) sur `GET https://glycibio.fr/api/health` toutes les 5 min, alerte e-mail si ≠ 200 ou contenu ≠ `db:up`.

### 5.2 Erreurs applicatives (Sentry — optionnel)
- En l'état : `SentryService` est **no-op** sans `SENTRY_DSN` ; les 500 sont tracées en **logs JSON** via PM2 (fail-loudly).
- Pour activer : `npm i @sentry/node` (server), définir `SENTRY_DSN` dans `.env`, reload. `errorHandler` enverra alors les exceptions.

### 5.3 Logs
- `pm2 logs glycibio-api` (temps réel) ; rotation : `pm2 install pm2-logrotate` (limite la taille des fichiers).
- Les secrets/mots de passe sont **rédactés** par le `Logger`.

### 5.4 Crons applicatifs (panier abandonné, expiration checkout)
- Surveiller dans les logs les exécutions (succès/échec). En cas d'échecs répétés, vérifier la connexion DB.

---

## 6. Checklists

**Hebdomadaire** : health OK · `pm2 status` (restarts anormaux ?) · `df -h` (disque) · dump < 24 h présent.
**Mensuelle** : SSL Labs (note A) · `npm audit` (server + client) · vérifier copie hors-site.
**Trimestrielle** : rotation des secrets · **test de restauration** d'un dump · revue des accès.
