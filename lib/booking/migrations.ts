import type { Query } from "./inquiries";

// Mirrors db/migrations/*.sql exactly. Kept as inline statements (rather than
// reading the .sql files from disk) because serverless function bundling does
// not reliably include non-imported files, while this module is guaranteed to
// be bundled since it is imported directly by the route that uses it.
const MIGRATIONS: { id: string; statements: string[] }[] = [
  {
    id: "001_booking_inquiries.sql",
    statements: [
      `CREATE TABLE IF NOT EXISTS pf2p_inquiries (
        id uuid PRIMARY KEY,
        payload_hash text NOT NULL,
        payload jsonb NOT NULL,
        booking_status text NOT NULL DEFAULT 'INQUIRY' CHECK (booking_status = 'INQUIRY'),
        payment_status text NOT NULL DEFAULT 'UNPAID' CHECK (payment_status = 'UNPAID'),
        created_at timestamptz NOT NULL DEFAULT now(),
        notification jsonb NOT NULL,
        notification_status text NOT NULL DEFAULT 'pending'
          CHECK (notification_status IN ('pending', 'sending', 'accepted', 'review')),
        notification_attempts integer NOT NULL DEFAULT 0,
        first_attempt_at timestamptz,
        next_attempt_at timestamptz NOT NULL DEFAULT now(),
        lease_until timestamptz,
        lease_token uuid,
        provider_message_id text,
        last_error text
      )`,
      `CREATE INDEX IF NOT EXISTS pf2p_inquiries_notification_queue
        ON pf2p_inquiries(next_attempt_at) WHERE notification_status IN ('pending', 'sending')`,
      `CREATE TABLE IF NOT EXISTS pf2p_inquiry_limits (
        bucket text PRIMARY KEY,
        attempts integer NOT NULL DEFAULT 1,
        expires_at timestamptz NOT NULL
      )`,
    ],
  },
  {
    id: "002_booking_availability.sql",
    statements: [
      `CREATE TABLE IF NOT EXISTS pf2p_availability (
        session_date date PRIMARY KEY,
        status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )`,
      `CREATE TABLE IF NOT EXISTS pf2p_bookings (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        inquiry_id uuid NOT NULL REFERENCES pf2p_inquiries(id),
        session_date date NOT NULL,
        status text NOT NULL DEFAULT 'pending_approval'
          CHECK (status IN ('pending_approval', 'held', 'confirmed', 'paid_in_full', 'cancelled', 'expired')),
        hold_token uuid,
        hold_expires_at timestamptz,
        agreement_accepted_at timestamptz,
        promo_use_permission boolean NOT NULL DEFAULT false,
        retainer_amount_cents integer NOT NULL DEFAULT 30000,
        retainer_checkout_session_id text,
        retainer_payment_status text NOT NULL DEFAULT 'unpaid'
          CHECK (retainer_payment_status IN ('unpaid', 'pending', 'paid', 'failed', 'refunded')),
        balance_amount_cents integer NOT NULL DEFAULT 69500,
        balance_checkout_session_id text,
        balance_payment_status text NOT NULL DEFAULT 'unpaid'
          CHECK (balance_payment_status IN ('unpaid', 'pending', 'paid', 'failed', 'refunded')),
        cancelled_at timestamptz,
        cancellation_reason text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS pf2p_bookings_active_date_uidx
        ON pf2p_bookings (session_date)
        WHERE status IN ('held', 'confirmed', 'paid_in_full')`,
      `CREATE INDEX IF NOT EXISTS pf2p_bookings_hold_expiry_idx
        ON pf2p_bookings (hold_expires_at)
        WHERE status = 'held'`,
      `CREATE INDEX IF NOT EXISTS pf2p_bookings_inquiry_idx ON pf2p_bookings (inquiry_id)`,
      `CREATE TABLE IF NOT EXISTS pf2p_stripe_events (
        event_id text PRIMARY KEY,
        event_type text NOT NULL,
        received_at timestamptz NOT NULL DEFAULT now()
      )`,
    ],
  },
  {
    id: "003_booking_payments_and_refunds.sql",
    statements: [
      `ALTER TABLE pf2p_bookings ADD COLUMN IF NOT EXISTS agreement_version text`,
      `ALTER TABLE pf2p_bookings ADD COLUMN IF NOT EXISTS agreement_text_hash text`,
      `ALTER TABLE pf2p_bookings ADD COLUMN IF NOT EXISTS rescheduled_from_booking_id uuid REFERENCES pf2p_bookings(id)`,
      `ALTER TABLE pf2p_bookings ADD COLUMN IF NOT EXISTS needs_resolution boolean NOT NULL DEFAULT false`,
      `CREATE TABLE IF NOT EXISTS pf2p_payment_attempts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id uuid NOT NULL REFERENCES pf2p_bookings(id),
        payment_type text NOT NULL CHECK (payment_type IN ('retainer', 'balance')),
        checkout_session_id text NOT NULL UNIQUE,
        checkout_url text NOT NULL,
        amount_cents integer NOT NULL,
        currency text NOT NULL DEFAULT 'usd',
        livemode boolean NOT NULL,
        status text NOT NULL DEFAULT 'created'
          CHECK (status IN ('created', 'paid', 'expired', 'needs_resolution')),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        expires_at timestamptz NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS pf2p_payment_attempts_booking_idx ON pf2p_payment_attempts (booking_id, payment_type)`,
      `CREATE UNIQUE INDEX IF NOT EXISTS pf2p_payment_attempts_one_active_uidx
        ON pf2p_payment_attempts (booking_id, payment_type) WHERE status = 'created'`,
      `CREATE TABLE IF NOT EXISTS pf2p_refund_records (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id uuid NOT NULL REFERENCES pf2p_bookings(id),
        amount_cents integer NOT NULL,
        reason text NOT NULL,
        status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
        reference text,
        recorded_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )`,
    ],
  },
];

export async function runPendingMigrations(query: Query) {
  await query(
    `CREATE TABLE IF NOT EXISTS pf2p_schema_migrations (
      id text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`,
    [],
  );

  const appliedRows = (await query("SELECT id FROM pf2p_schema_migrations", [])) as { id: string }[];
  const applied = new Set(appliedRows.map((r) => r.id));

  const results: { id: string; status: "applied" | "skipped" | "failed"; error?: string }[] = [];

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.id)) {
      results.push({ id: migration.id, status: "skipped" });
      continue;
    }
    try {
      for (const statement of migration.statements) {
        await query(statement, []);
      }
      await query("INSERT INTO pf2p_schema_migrations (id) VALUES ($1)", [migration.id]);
      results.push({ id: migration.id, status: "applied" });
    } catch (err) {
      results.push({ id: migration.id, status: "failed", error: err instanceof Error ? err.name : "unknown" });
      break;
    }
  }

  return results;
}
