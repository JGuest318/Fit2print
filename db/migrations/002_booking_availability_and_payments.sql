BEGIN;

-- Owner-approved availability. Only dates explicitly opened by the owner can be requested.
CREATE TABLE IF NOT EXISTS pf2p_availability (
  session_date date PRIMARY KEY,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Bookings: the reservation/hold/payment state machine tied to an inquiry.
CREATE TABLE IF NOT EXISTS pf2p_bookings (
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
  agreement_version text,
  agreement_text_hash text,
  rescheduled_from_booking_id uuid REFERENCES pf2p_bookings(id),
  needs_resolution boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Prevent double-booking: only one ACTIVE (held/confirmed/paid_in_full) booking per date.
CREATE UNIQUE INDEX IF NOT EXISTS pf2p_bookings_active_date_uidx
  ON pf2p_bookings (session_date)
  WHERE status IN ('held', 'confirmed', 'paid_in_full');

CREATE INDEX IF NOT EXISTS pf2p_bookings_hold_expiry_idx
  ON pf2p_bookings (hold_expires_at)
  WHERE status = 'held';

CREATE INDEX IF NOT EXISTS pf2p_bookings_inquiry_idx ON pf2p_bookings (inquiry_id);

-- Idempotency record for Stripe webhook events (never process the same event twice).
CREATE TABLE IF NOT EXISTS pf2p_stripe_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);

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
-- visits safe — the losing request re-reads and reuses the winner's row instead of
-- calling Stripe a second time.
CREATE UNIQUE INDEX IF NOT EXISTS pf2p_payment_attempts_one_active_uidx
  ON pf2p_payment_attempts (booking_id, payment_type) WHERE status = 'created';

-- Manual refund ledger for V1: not wired to Stripe's refund API automatically, but
-- gives a clear, queryable record of what is owed, refunded (or still pending), and
-- which original payment it corresponds to.
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
