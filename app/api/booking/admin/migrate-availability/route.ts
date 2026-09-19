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
