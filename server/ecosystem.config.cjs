// ============================================================
// PM2 — configuration de process pour un VPS Ubuntu (OVHcloud, Hostinger, ...).
// Voir docs/DEPLOYMENT-OVH.md ou docs/DEPLOYMENT-HOSTINGER.md.
//
// Mode FORK + 1 instance, et c'est VOULU : l'API embarque des taches planifiees
// (cron panier abandonne + expiration des paiements) demarrees dans server.js.
// En mode CLUSTER multi-instances, CHAQUE worker relancerait ces crons -> emails
// et traitements en double, avec conditions de course sur les memes commandes.
// Un unique process garantit une execution unique des taches.
//
// Mise a l'echelle horizontale (optionnel, gros trafic) : passer l'API en
// `exec_mode: 'cluster'` + `instances: 'max'` avec `DISABLE_CRON: '1'`, et
// ajouter un 2e app fork unique dedie aux crons. Voir les guides de deploiement (docs/).
// ============================================================
module.exports = {
  apps: [
    {
      name: 'glycibio-api',
      script: 'src/server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        LOG_FORMAT: 'json',
        TRUST_PROXY: '1', // derriere Nginx : vraie IP cliente via X-Forwarded-For
      },
      max_memory_restart: '300M',
      out_file: 'logs/pm2-out.log',
      error_file: 'logs/pm2-error.log',
      time: true,
    },
  ],
};
