const { readFileSync } = require('node:fs');
const { neon } = require('@neondatabase/serverless');
// Explicit opt-in avoids accidentally migrating a database from inherited env.
if (process.env.BOOKING_MIGRATION_CONFIRM !== 'preview' || !process.env.BOOKING_DATABASE_URL) {
  console.error('Set BOOKING_DATABASE_URL for the isolated preview database and BOOKING_MIGRATION_CONFIRM=preview.');
  process.exit(1);
}
const sql = neon(process.env.BOOKING_DATABASE_URL);
const statements = readFileSync('db/migrations/001_booking_inquiries.sql', 'utf8')
  .split(';').map(s => s.trim()).filter(s => s && !['BEGIN', 'COMMIT'].includes(s));
sql.transaction(statements.map(s => sql.query(s)))
  .then(() => console.log('Preview booking schema applied.'))
  .catch(() => { console.error('Migration failed; no credentials or query payloads logged.'); process.exitCode = 1; });
