import { randomUUID } from "node:crypto";
import type { Query } from "./inquiries";

export type PaymentType = "retainer" | "balance";

export type PaymentAttempt = {
  id: string;
  booking_id: string;
  payment_type: PaymentType;
  checkout_session_id: string;
  checkout_url: string;
  amount_cents: number;
  currency: string;
  livemode: boolean;
  status: "created" | "paid" | "expired" | "needs_resolution";
  expires_at: string;
};

export class AttemptInFlight extends Error {}

// Reuse an active, unexpired Checkout session instead of minting a new one on every
// visit to the pay link.
export async function findReusableAttempt(query: Query, bookingId: string, paymentType: PaymentType): Promise<PaymentAttempt | null> {
  const rows = await query(
    `SELECT * FROM pf2p_payment_attempts
     WHERE booking_id = $1 AND payment_type = $2 AND status = 'created' AND expires_at > now()
     ORDER BY created_at DESC LIMIT 1`,
    [bookingId, paymentType],
  );
  return rows.length ? (rows[0] as unknown as PaymentAttempt) : null;
}

// Concurrency guard for "simultaneous payment-link visits create two sessions":
// a partial UNIQUE index on (booking_id, payment_type) WHERE status = 'created'
// means at most one row can hold that slot. This inserts a PLACEHOLDER row (a
// real Stripe session doesn't exist yet) to atomically claim the slot before any
// Stripe API call is made. If another request already holds it, this throws
// AttemptInFlight and the caller should re-read the (now-existing) row instead of
// creating a second Stripe session.
export async function acquireAttemptSlot(
  query: Query,
  bookingId: string,
  paymentType: PaymentType,
  livemode: boolean,
): Promise<{ placeholderId: string; placeholderSessionId: string }> {
  const placeholderSessionId = `pending:${randomUUID()}`;
  try {
    const rows = await query(
      `INSERT INTO pf2p_payment_attempts
         (booking_id, payment_type, checkout_session_id, checkout_url, amount_cents, currency, livemode, status, expires_at)
       VALUES ($1, $2, $3, '', 0, 'usd', $4, 'created', now() + interval '2 minutes')
       RETURNING id`,
      [bookingId, paymentType, placeholderSessionId, livemode],
    );
    return { placeholderId: String(rows[0].id), placeholderSessionId };
  } catch {
    throw new AttemptInFlight();
  }
}

export async function finalizeAttempt(
  query: Query,
  placeholderId: string,
  params: { checkoutSessionId: string; checkoutUrl: string; amountCents: number; currency: string; expiresAt: string },
): Promise<void> {
  await query(
    `UPDATE pf2p_payment_attempts SET
       checkout_session_id = $2, checkout_url = $3, amount_cents = $4, currency = $5,
       expires_at = to_timestamp($6), updated_at = now()
     WHERE id = $1`,
    [
      placeholderId,
      params.checkoutSessionId,
      params.checkoutUrl,
      params.amountCents,
      params.currency,
      Math.floor(new Date(params.expiresAt).getTime() / 1000),
    ],
  );
}

// Frees the slot if Stripe session creation failed after we claimed it, so a
// subsequent retry isn't permanently blocked by a dead placeholder.
export async function releaseFailedAttemptSlot(query: Query, placeholderId: string): Promise<void> {
  await query(`DELETE FROM pf2p_payment_attempts WHERE id = $1 AND checkout_url = ''`, [placeholderId]);
}

export async function getAttemptBySessionId(query: Query, checkoutSessionId: string): Promise<PaymentAttempt | null> {
  const rows = await query(`SELECT * FROM pf2p_payment_attempts WHERE checkout_session_id = $1`, [checkoutSessionId]);
  return rows.length ? (rows[0] as unknown as PaymentAttempt) : null;
}

export async function getAttemptById(query: Query, id: string): Promise<PaymentAttempt | null> {
  const rows = await query(`SELECT * FROM pf2p_payment_attempts WHERE id = $1`, [id]);
  return rows.length ? (rows[0] as unknown as PaymentAttempt) : null;
}

export type ConfirmOutcome = "confirmed" | "duplicate_event" | "unknown_session" | "mismatch" | "stale_booking";

// Atomic AND concurrency-safe: the booking row is read with FOR UPDATE inside the
// same statement that later writes it, so a concurrent cancellation/reschedule on
// the same booking cannot interleave between our read of its status and our write
// — Postgres will block the other transaction on that row lock until this commits,
// and it will then see our committed result rather than acting on stale data.
export async function confirmPaymentEvent(
  query: Query,
  params: {
    eventId: string;
    eventType: string;
    checkoutSessionId: string;
    amountCents: number;
    currency: string;
    livemode: boolean;
    paymentType: PaymentType;
  },
): Promise<ConfirmOutcome> {
  const rows = await query(
    `WITH new_event AS (
       INSERT INTO pf2p_stripe_events (event_id, event_type)
       VALUES ($1, $2)
       ON CONFLICT (event_id) DO NOTHING
       RETURNING event_id
     ),
     attempt_match AS (
       SELECT pa.id AS attempt_id, pa.amount_cents, pa.currency, pa.livemode, pa.status AS attempt_status,
              b.id AS booking_id, b.status AS booking_status, b.hold_expires_at
       FROM pf2p_payment_attempts pa
       JOIN pf2p_bookings b ON b.id = pa.booking_id
       WHERE pa.checkout_session_id = $3
       FOR UPDATE OF b
     ),
     outcome AS (
       SELECT *,
         CASE
           WHEN NOT EXISTS (SELECT 1 FROM new_event) THEN 'duplicate_event'
           WHEN attempt_id IS NULL THEN 'unknown_session'
           WHEN amount_cents <> $4 OR currency <> $5 OR livemode <> $6 THEN 'mismatch'
           WHEN $7 = 'retainer' AND (booking_status <> 'held' OR hold_expires_at < now()) THEN 'stale_booking'
           WHEN $7 = 'balance' AND booking_status <> 'confirmed' THEN 'stale_booking'
           ELSE 'ok'
         END AS result
       FROM attempt_match
       UNION ALL
       SELECT NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
         CASE WHEN NOT EXISTS (SELECT 1 FROM new_event) THEN 'duplicate_event' ELSE 'unknown_session' END
       WHERE NOT EXISTS (SELECT 1 FROM attempt_match)
     ),
     picked AS (
       SELECT * FROM outcome LIMIT 1
     ),
     update_attempt AS (
       UPDATE pf2p_payment_attempts SET
         status = CASE WHEN (SELECT result FROM picked) = 'ok' THEN 'paid' ELSE 'needs_resolution' END,
         updated_at = now()
       WHERE id = (SELECT attempt_id FROM picked)
         AND (SELECT result FROM picked) IN ('ok', 'mismatch', 'stale_booking')
       RETURNING id
     ),
     update_booking_ok AS (
       UPDATE pf2p_bookings SET
         retainer_payment_status = CASE WHEN $7 = 'retainer' AND (SELECT result FROM picked) = 'ok' THEN 'paid' ELSE retainer_payment_status END,
         balance_payment_status = CASE WHEN $7 = 'balance' AND (SELECT result FROM picked) = 'ok' THEN 'paid' ELSE balance_payment_status END,
         status = CASE
           WHEN $7 = 'retainer' AND (SELECT result FROM picked) = 'ok' THEN 'confirmed'
           WHEN $7 = 'balance' AND (SELECT result FROM picked) = 'ok' THEN 'paid_in_full'
           ELSE status
         END,
         updated_at = now()
       WHERE id = (SELECT booking_id FROM picked) AND (SELECT result FROM picked) = 'ok'
       RETURNING id
     ),
     update_booking_needs_resolution AS (
       UPDATE pf2p_bookings SET needs_resolution = true, updated_at = now()
       WHERE id = (SELECT booking_id FROM picked) AND (SELECT result FROM picked) IN ('mismatch', 'stale_booking')
       RETURNING id
     )
     SELECT (SELECT result FROM picked) AS result`,
    [
      params.eventId,
      params.eventType,
      params.checkoutSessionId,
      params.amountCents,
      params.currency,
      params.livemode,
      params.paymentType,
    ],
  );
  if (!rows.length) return "duplicate_event";
  return (rows[0].result as ConfirmOutcome) ?? "duplicate_event";
}

export type RefundStatus = "pending" | "completed" | "failed";

export async function recordRefund(
  query: Query,
  bookingId: string,
  amountCents: number,
  reason: string,
  status: RefundStatus,
  reference: string | null,
): Promise<void> {
  await query(
    `INSERT INTO pf2p_refund_records (booking_id, amount_cents, reason, status, reference)
     VALUES ($1, $2, $3, $4, $5)`,
    [bookingId, amountCents, reason, status, reference],
  );
}

export async function updateRefundStatus(query: Query, refundId: string, status: RefundStatus): Promise<void> {
  await query(`UPDATE pf2p_refund_records SET status = $2, updated_at = now() WHERE id = $1`, [refundId, status]);
}

export async function listRefunds(query: Query, bookingId: string): Promise<Array<{ id: string; amount_cents: number; reason: string; status: RefundStatus; reference: string | null; recorded_at: string }>> {
  const rows = await query(
    `SELECT id, amount_cents, reason, status, reference, recorded_at FROM pf2p_refund_records WHERE booking_id = $1 ORDER BY recorded_at`,
    [bookingId],
  );
  return rows as Array<{ id: string; amount_cents: number; reason: string; status: RefundStatus; reference: string | null; recorded_at: string }>;
}
