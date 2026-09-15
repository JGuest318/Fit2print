BEGIN;
CREATE TABLE IF NOT EXISTS pf2p_inquiries (
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
);
CREATE INDEX IF NOT EXISTS pf2p_inquiries_notification_queue
  ON pf2p_inquiries(next_attempt_at) WHERE notification_status IN ('pending', 'sending');
CREATE TABLE IF NOT EXISTS pf2p_inquiry_limits (
  bucket text PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 1,
  expires_at timestamptz NOT NULL
);
COMMIT;
