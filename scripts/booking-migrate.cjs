const { readFileSync, readdirSync } = require('node:fs');
const path = require('node:path');
const { neon } = require('@neondatabase/serverless');

// Explicit opt-in avoids accidentally migrating a database from inherited env.
if (process.env.BOOKING_MIGRATION_CONFIRM !== 'preview' || !process.env.BOOKING_DATABASE_URL) {
  console.error('Set BOOKING_DATABASE_URL for the isolated preview database and BOOKING_MIGRATION_CONFIRM=preview.');
  process.exit(1);
}

const sql = neon(process.env.BOOKING_DATABASE_URL);
const MIGRATIONS_DIR = path.join(__dirname, '..', 'db', 'migrations');

function splitStatements(fileContent) {
  return fileContent
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s && !['BEGIN', 'COMMIT'].includes(s));
}

async function main() {
  // Tracking table: every migration file is applied at most once, ever, per database.
  // This is what makes running this script safe and idempotent regardless of whether
  // the target database is empty or already has an earlier subset of the schema.
  await sql`CREATE TABLE IF NOT EXISTS pf2p_schema_migrations (
    id text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`;

  const appliedRows = await sql`SELECT id FROM pf2p_schema_migrations`;
  const applied = new Set(appliedRows.map((r) => r.id));

  // Filenames are zero-padded numeric prefixes (001_, 002_, 003_, ...), so a plain
  // lexical sort is also the correct migration order. Each number is used exactly once.
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const pending = files.filter((f) => !applied.has(f));

  if (pending.length === 0) {
    console.log('No pending migrations. Schema already up to date.');
    return;
  }

  for (const file of pending) {
    const statements = splitStatements(readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'));
    const queries = statements.map((s) => sql.query(s));
    // Record the migration as applied inside the SAME transaction as its DDL, so a
    // failure never leaves a migration half-applied-but-marked-done or vice versa.
    queries.push(sql`INSERT INTO pf2p_schema_migrations (id) VALUES (${file})`);
    await sql.transaction(queries);
    console.log(`Applied ${file}`);
  }

  console.log(`Preview booking schema applied. (${pending.length} migration(s) run: ${pending.join(', ')})`);
}

main().catch(() => {
  console.error('Migration failed; no credentials or query payloads logged.');
  process.exitCode = 1;
});
