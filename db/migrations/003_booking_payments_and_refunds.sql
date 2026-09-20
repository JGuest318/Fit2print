BEGIN;

-- Forward-compatible upgrade of pf2p_bookings for agreement provenance and reschedule
-- lineage. Uses ADD COLUMN IF NOT EXISTS so this is safe to run whether pf2p_bookings
-- was just created by 002 in this same run, or already existed from an earlier deploy
-- (this replaces a defective duplicate-numbered 002 file that used CREATE TABLE
-- IF NOT EXISTS and therefore silently failed to add these columns to an existing
-- table -- see docs/booking-inquiry-activation.md for the reproduction).
ALTER TABLE pf2p_bookings ADD COLUMN IF NOT EXISTS agreement_version text;
ALTER TABLE pf2p_bookings ADD COLUMN IF NOT EXISTS agreement_text_hash text;
ALTER TABLE pf2p_bookings ADD COLUMN IF NOT EXISTS rescheduled_from_booking_id uuid REFERENCES pf2p_bookings(id);
ALTER TABLE pf2p_bookings ADD COLUMN IF NOT EXISTS needs_resolution boolean NOT NULL DEFAULT false;

-- Full history of every Checkout session ever created for a booking. Reused to avoid
-- minting a new session on every pay-link visit, and to reconcile a payment against
-- whichever session actually completed, not just the "current" one.
CREATE TABLE IF NOT EXISTS pf2p_payment_attempts (
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
);

CREATE INDEX IF NOT EXISTS pf2p_payment_attempts_booking_idx ON pf2p_payment_attempts (booking_id, payment_type);

-- Concurrency safety: only ONE 'created' (in-flight or active) attempt may exist per
-- booking+payment_type at a time. This is the mutex that makes simultaneous pay-link
-- visits safe -- the losing request re-reads and reuses the winner's row instead of
-- calling Stripe a second time.
CREATE UNIQUE INDEX IF NOT EXISTS pf2p_payment_attempts_one_active_uidx
  ON pf2p_payment_attempts (booking_id, payment_type) WHERE status = 'created';

-- Manual refund ledger for V1: gives a clear, queryable record of what is owed,
-- refunded (or still pending), and which original payment it corresponds to.
CREATE TABLE IF NOT EXISTS pf2p_refund_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES pf2p_bookings(id),
  amount_cents integer NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  reference text,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMIT;
