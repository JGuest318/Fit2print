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

COMMIT;
