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

// Reuse an active, unexpired Checkout session instead of minting a new one on every
// visit to the pay link — otherwise a client who pays an older link's session would
// get no booking credit, because the booking only remembered the newest session id.
export async function findReusableAttempt(query: Query, bookingId: string, paymentType: PaymentType): Promise<PaymentAttempt | null> {
  const rows = await query(
    `SELECT * FROM pf2p_payment_attempts
     WHERE booking_id = $1 AND payment_type = $2 AND status = 'created' AND expires_at > now()
     ORDER BY created_at DESC LIMIT 1`,
    [bookingId, paymentType],
  );
  return rows.length ? (rows[0] as unknown as PaymentAttempt) : null;
}

export async function getAttemptBySessionId(query: Query, checkoutSessionId: string): Promise<PaymentAttempt | null> {
  const rows = await query(`SELECT * FROM pf2p_payment_attempts WHERE checkout_session_id = $1`, [checkoutSessionId]);
  return rows.length ? (rows[0] as unknown as PaymentAttempt) : null;
}

export async function recordAttempt(
  query: Query,
  params: {
    bookingId: string;
    paymentType: PaymentType;
    checkoutSessionId: string;
    checkoutUrl: string;
    amountCents: number;
    currency: string;
    livemode: boolean;
    expiresAt: string;
  },
): Promise<void> {
  await query(
    `INSERT INTO pf2p_payment_attempts
       (booking_id, payment_type, checkout_session_id, checkout_url, amount_cents, currency, livemode, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, to_timestamp($8))`,
    [
      params.bookingId,
      params.paymentType,
      params.checkoutSessionId,
      params.checkoutUrl,
      params.amountCents,
      params.currency,
      params.livemode,
      Math.floor(new Date(params.expiresAt).getTime() / 1000),
    ],
  );
}

export type ConfirmOutcome = "confirmed" | "duplicate_event" | "unknown_session" | "mismatch" | "stale_booking";

// The single atomic operation at the heart of the payment-correctness fix.
// Runs as ONE SQL statement (Postgres treats one statement as one implicit
// transaction), so the event-idempotency record and the booking/attempt update
// rise or fall together — there is no window where the event is marked "received"
// but the booking update is lost, which was the original defect.
//
// Full validation happens inside the same statement: the checkout session must be
// a known attempt, amount/currency/livemode must match exactly what we created,
// and the booking must still be in the correct precursor state for this payment
// type (held+not-expired for retainer, confirmed for balance). Anything that
// doesn't satisfy all of that is marked needs_resolution rather than silently
// dropped or blindly confirmed against a date that may no longer be available.
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

export async function recordRefund(query: Query, bookingId: string, amountCents: number, reason: string): Promise<void> {
  await query(
    `INSERT INTO pf2p_refund_records (booking_id, amount_cents, reason) VALUES ($1, $2, $3)`,
    [bookingId, amountCents, reason],
  );
}

export async function listRefunds(query: Query, bookingId: string): Promise<Array<{ amount_cents: number; reason: string; recorded_at: string }>> {
  const rows = await query(
    `SELECT amount_cents, reason, recorded_at FROM pf2p_refund_records WHERE booking_id = $1 ORDER BY recorded_at`,
    [bookingId],
  );
  return rows as Array<{ amount_cents: number; reason: string; recorded_at: string }>;
}
