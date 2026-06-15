#!/usr/bin/env bash
# ============================================================
# GlyciBio — Deploiement / mise a jour sur le VPS (Ubuntu + Nginx + PM2)
# ------------------------------------------------------------
# A executer SUR LE SERVEUR, depuis la racine du depot (ex: ~/glycibio) :
#
#     bash deploy/deploy.sh
#
# Variables d'environnement (optionnelles) :
#     DEPLOY_BRANCH=main        branche a deployer
#     PM2_APP=glycibio-api      nom du process PM2
#     APPLY_NGINX=ask|yes|no    appliquer deploy/nginx/glycibio.conf (CSP+securite)
#     NGINX_SITE=/etc/nginx/sites-available/glycibio
#
# Sur : echoue vite (set -euo pipefail), teste `nginx -t` AVANT de recharger
# et RESTAURE l'ancienne config si le test echoue. Build front + deps API,
# reload PM2 sans downtime, puis verifie /api/health.
# ============================================================
set -euo pipefail

BRANCH="${DEPLOY_BRANCH:-main}"
PM2_APP="${PM2_APP:-glycibio-api}"
NGINX_SITE="${NGINX_SITE:-/etc/nginx/sites-available/glycibio}"
APPLY_NGINX="${APPLY_NGINX:-ask}"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$REPO_DIR"
echo "============================================================"
echo " GlyciBio deploy"
echo "   depot   : $REPO_DIR"
echo "   remote  : $(git remote get-url origin 2>/dev/null || echo '???')"
echo "   branche : $BRANCH"
echo "============================================================"

# Garde-fou : le code de production vit sur 'glycibio-clean'. Si origin pointe
# encore vers l'ancien depot, le pull recupererait du vieux code.
if ! git remote get-url origin 2>/dev/null | grep -q "glycibio-clean"; then
  echo "!! ATTENTION: 'origin' ne pointe pas vers 'glycibio-clean'."
  echo "   Corriger si besoin :"
  echo "     git remote set-url origin https://github.com/shaabanalabdi/glycibio-clean.git"
  read -r -p "   Continuer quand meme ? [y/N] " ok || true
  [[ "${ok:-}" =~ ^[Yy]$ ]] || { echo "Abandon."; exit 1; }
fi

# 1) Recuperer le code (ff-only : refuse de clobber d'eventuels commits locaux)
echo "==> [1/6] git fetch + checkout $BRANCH + pull --ff-only"
git fetch --prune origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"
echo "    HEAD = $(git rev-parse --short HEAD) — $(git log -1 --pretty=%s)"

# 2) Build du front (devDeps necessaires : vite). VITE_API_URL=/api (same-origin).
echo "==> [2/6] Build front (client)"
(
  cd client
  [ -f .env ] || echo "VITE_API_URL=/api" > .env
  npm ci --legacy-peer-deps
  npm run build
)

# 3) Dependances API (production uniquement)
echo "==> [3/6] Install deps API (server, prod)"
(
  cd server
  npm ci --omit=dev
  mkdir -p logs uploads/products
)

# 4) (Optionnel) Appliquer la config Nginx versionnee (CSP + en-tetes de securite)
apply_nginx() {
  local ts backup
  ts="$(date +%Y%m%d-%H%M%S)"
  backup="${NGINX_SITE}.bak-${ts}"
  echo "    application de deploy/nginx/glycibio.conf -> $NGINX_SITE"
  if [ -f "$NGINX_SITE" ]; then
    sudo cp "$NGINX_SITE" "$backup"
    echo "    sauvegarde de l'ancienne config : $backup"
  fi
  sudo cp deploy/nginx/glycibio.conf "$NGINX_SITE"
  if sudo nginx -t; then
    sudo systemctl reload nginx
    echo "    Nginx teste et recharge."
  else
    echo "!! 'nginx -t' a ECHOUE -> restauration de l'ancienne config."
    if [ -f "$backup" ]; then
      sudo cp "$backup" "$NGINX_SITE"
      sudo nginx -t && sudo systemctl reload nginx || true
    fi
    echo "!! Config Nginx NON appliquee. Verifier les chemins SSL/root dans"
    echo "   deploy/nginx/glycibio.conf (certbot doit avoir cree le certificat)."
    return 1
  fi
}
echo "==> [4/6] Config Nginx (CSP + securite)"
case "$APPLY_NGINX" in
  yes) apply_nginx || true ;;
  no)  echo "    (saut — APPLY_NGINX=no)" ;;
  *)
    read -r -p "    Appliquer deploy/nginx/glycibio.conf (CSP+securite) ? [y/N] " ans || true
    if [[ "${ans:-}" =~ ^[Yy]$ ]]; then apply_nginx || true; else echo "    Config Nginx inchangee."; fi
    ;;
esac

# 5) Recharger l'API via PM2 (zero downtime, relit server/.env grace a --update-env)
echo "==> [5/6] Reload API PM2 ($PM2_APP)"
if pm2 describe "$PM2_APP" >/dev/null 2>&1; then
  pm2 reload "$PM2_APP" --update-env
else
  echo "    process PM2 absent -> demarrage initial (ecosystem.config.cjs)"
  ( cd server && pm2 start ecosystem.config.cjs && pm2 save )
fi

# 6) Verification du health check applicatif
echo "==> [6/6] Verification /api/health"
sleep 2
if curl -fsS http://127.0.0.1:5000/api/health 2>/dev/null | tee /tmp/glycibio_health; then
  echo ""
  echo "    OK."
else
  echo "!! /api/health ne repond pas. Diagnostic : pm2 logs $PM2_APP --lines 50"
  exit 1
fi

echo "============================================================"
echo " Deploiement termine — HEAD=$(git rev-parse --short HEAD)"
echo "------------------------------------------------------------"
echo " RAPPELS go-live (a faire une seule fois) :"
echo "  - Changer le mot de passe admin par defaut (hash public dans le seed) :"
echo "      UPDATE users SET password='<hash bcrypt>' WHERE email='admin@glycibio.fr';"
echo "  - server/.env : secrets JWT forts, Stripe LIVE, SMTP (noreply@glycibio.fr)."
echo "  - Webhook Stripe -> https://glycibio.fr/api/webhooks/stripe (cf. DEPLOYMENT-OVH.md etape 9)."
echo "============================================================"
