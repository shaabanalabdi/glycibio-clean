// ============================================================
// Exécute un fichier SQL via le pool mysql2 du projet
// Usage : node scripts/run-migration.js <path-to-sql>
// ============================================================
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

(async () => {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node scripts/run-migration.js <path-to-sql>');
    process.exit(1);
  }

  const fullPath = path.resolve(file);
  if (!fs.existsSync(fullPath)) {
    console.error(`Fichier introuvable : ${fullPath}`);
    process.exit(1);
  }

  const rawSql = fs.readFileSync(fullPath, 'utf8');

  // Strip SQL comments (lines starting with -- and block comments /* */)
  const cleaned = rawSql
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');

  // Split on semicolon at end of statement
  const statements = cleaned
    .split(/;\s*(?=\n|$)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`Migration : ${path.basename(fullPath)} (${statements.length} statement(s))`);

  // Use direct connection with multipleStatements enabled
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: false,
  });

  for (const stmt of statements) {
    const preview = stmt.replace(/\s+/g, ' ').slice(0, 80);
    try {
      await connection.query(stmt);
      console.log(`  OK  : ${preview}...`);
    } catch (err) {
      if (/already exists|Duplicate column|Duplicate key/i.test(err.message)) {
        console.log(`  SKIP: ${preview}... (${err.message})`);
      } else {
        console.error(`  FAIL: ${preview}...`);
        console.error(`         ${err.message}`);
        await connection.end();
        process.exit(2);
      }
    }
  }

  console.log('\nMigration terminee.');
  await connection.end();
  process.exit(0);
})();
