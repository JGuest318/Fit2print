import { timingSafeEqual } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

// Idempotent (all statements are IF NOT EXISTS / CREATE OR REPLACE style).
// Safe to call more than once. Auth-gated the same way as the retry worker.
const STATEMENTS = [
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
  `ALTER TABLE pf2p_bookings ADD COLUMN IF NOT EXISTS agreement_version text`,
  `ALTER TABLE pf2p_bookings ADD COLUMN IF NOT EXISTS agreement_text_hash text`,
  // Reschedule lineage: a rescheduled booking is a NEW row that carries the paid
  // credit forward; this links it back to the booking it replaced.
  `ALTER TABLE pf2p_bookings ADD COLUMN IF NOT EXISTS rescheduled_from_booking_id uuid REFERENCES pf2p_bookings(id)`,
  // Flag for payments that arrived but could not be safely auto-confirmed
  // (expired hold, date taken by someone else, amount/currency/mode mismatch).
  `ALTER TABLE pf2p_bookings ADD COLUMN IF NOT EXISTS needs_resolution boolean NOT NULL DEFAULT false`,
  // Full history of every Checkout session ever created for a booking, so a payment
  // on an older (non-"current") session is still reconciled correctly, and repeated
  // visits to a pay link reuse an active session instead of minting a new one.
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
  `CREATE INDEX IF NOT EXISTS pf2p_payment_attempts_active_idx ON pf2p_payment_attempts (booking_id, payment_type, status) WHERE status = 'created'`,
  // Manual refund ledger for V1: not wired to Stripe's refund API automatically,
  // but gives a clear, queryable record of what was owed, refunded, and resolved.
  `CREATE TABLE IF NOT EXISTS pf2p_refund_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid NOT NULL REFERENCES pf2p_bookings(id),
    amount_cents integer NOT NULL,
    reason text NOT NULL,
    recorded_at timestamptz NOT NULL DEFAULT now()
  )`,
];

export async function POST(request: Request) {
  const secret = process.env.BOOKING_WORKER_SECRET;
  const dbUrl = process.env.BOOKING_DATABASE_URL;
  const provided = Buffer.from(request.headers.get("authorization") || "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (!secret || provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!dbUrl) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  try {
    const sql = neon(dbUrl);
    for (const statement of STATEMENTS) {
      await sql.query(statement, [], { fetchOptions: { signal: AbortSignal.timeout(10000) } });
    }
    return NextResponse.json({ success: true, applied: STATEMENTS.length }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Migration failed", detail: error instanceof Error ? error.message : "unknown" }, { status: 500 });
  }
}
