// ============================================================
// Sauvegarde de la base MySQL (dump compresse + retention).
//
// - Lit la config DB depuis .env (memes variables que le reste du projet).
// - Lance `mysqldump` (--single-transaction => pas de lock sur InnoDB) et
//   compresse le flux en .sql.gz via zlib (zero dependance, cross-platform :
//   pas besoin d'un binaire `gzip` externe, fonctionne sous Windows).
// - Applique une retention : supprime les dumps plus vieux que N jours.
//
// Usage :
//   node scripts/backup-db.js            # cree un dump
//   node scripts/backup-db.js --dry-run  # affiche ce qui serait fait, sans dumper
//
// Variables d'environnement (optionnelles) :
//   BACKUP_DIR             dossier de sortie       (defaut: server/backups)
//   BACKUP_RETENTION_DAYS  retention en jours      (defaut: 14)
//   MYSQLDUMP_BIN          chemin du binaire dump  (defaut: mysqldump)
//
// Planification :
//   - Linux (cron)        : 0 3 * * * cd /opt/glycibio/server && node scripts/backup-db.js >> /var/log/glycibio-backup.log 2>&1
//   - Windows (Task Sched): declenche `node scripts\backup-db.js` tous les jours a 3h
// ============================================================
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { spawn } = require('child_process');

const dryRun = process.argv.includes('--dry-run');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || '3306',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'glycibio',
};

const backupDir = process.env.BACKUP_DIR
  ? path.resolve(process.env.BACKUP_DIR)
  : path.resolve(__dirname, '..', 'backups');
const retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || '14', 10);
const mysqldumpBin = process.env.MYSQLDUMP_BIN || 'mysqldump';

// Horodatage compatible nom de fichier (Windows interdit ':') : 2026-06-05_0312
const stamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(/:/g, '');
const outFile = path.join(backupDir, `${config.database}_${stamp}.sql.gz`);

// --- Retention : supprime les dumps plus vieux que retentionDays ----------
const purgeOldBackups = () => {
  if (!fs.existsSync(backupDir)) return;
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  const pattern = new RegExp(`^${config.database}_.*\\.sql\\.gz$`);
  let removed = 0;
  for (const name of fs.readdirSync(backupDir)) {
    if (!pattern.test(name)) continue;
    const full = path.join(backupDir, name);
    if (fs.statSync(full).mtimeMs < cutoff) {
      fs.unlinkSync(full);
      removed += 1;
      console.log(`  purge : ${name}`);
    }
  }
  if (removed > 0) console.log(`Retention : ${removed} dump(s) > ${retentionDays} j supprime(s).`);
};

const main = () => {
  if (!config.user || !config.password) {
    console.error('Config DB incomplete : DB_USER / DB_PASSWORD manquants dans .env');
    process.exit(1);
  }

  const dumpArgs = [
    '--single-transaction', // snapshot coherent sans verrouiller (InnoDB)
    '--routines',           // procedures stockees (sp_recalc_order_totals)
    '--triggers',           // triggers order_items
    '--no-tablespaces',     // evite l'erreur PROCESS privilege sur certains hosts
    '-h', config.host,
    '-P', String(config.port),
    '-u', config.user,
    config.database,
  ];

  if (dryRun) {
    console.log('[dry-run] Aucune action effectuee.');
    console.log(`  Base       : ${config.database} @ ${config.host}:${config.port}`);
    console.log(`  Commande   : ${mysqldumpBin} ${dumpArgs.join(' ')}`);
    console.log(`  Sortie     : ${outFile}`);
    console.log(`  Retention  : ${retentionDays} jour(s) dans ${backupDir}`);
    return;
  }

  fs.mkdirSync(backupDir, { recursive: true });

  // Mot de passe passe via MYSQL_PWD (jamais en argv -> invisible dans `ps`).
  const child = spawn(mysqldumpBin, dumpArgs, {
    env: { ...process.env, MYSQL_PWD: config.password },
  });

  const gzip = zlib.createGzip();
  const out = fs.createWriteStream(outFile);
  let stderr = '';

  child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

  child.on('error', (err) => {
    if (err.code === 'ENOENT') {
      console.error(`mysqldump introuvable ("${mysqldumpBin}"). Installez MySQL client ou definissez MYSQLDUMP_BIN.`);
    } else {
      console.error(`Echec du lancement de mysqldump : ${err.message}`);
    }
    out.destroy();
    fs.rmSync(outFile, { force: true });
    process.exit(2);
  });

  child.stdout.pipe(gzip).pipe(out);

  out.on('finish', () => {
    // mysqldump termine ? on verifie le code de sortie.
  });

  child.on('close', (code) => {
    if (code !== 0) {
      console.error(`mysqldump a echoue (code ${code}).`);
      if (stderr.trim()) console.error(stderr.trim());
      fs.rmSync(outFile, { force: true });
      process.exit(2);
    }
    const sizeKb = (fs.statSync(outFile).size / 1024).toFixed(1);
    console.log(`Dump cree : ${outFile} (${sizeKb} Ko)`);
    purgeOldBackups();
    console.log('Sauvegarde terminee.');
  });
};

main();
