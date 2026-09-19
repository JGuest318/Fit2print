import { randomUUID } from "node:crypto";
import type { Query } from "./inquiries";

export class DateUnavailable extends Error {}
export class BookingNotFound extends Error {}

const HOLD_MINUTES = 30;
const RETAINER_CENTS = 30000;
const BALANCE_CENTS = 69500;

// Owner explicitly opens a date before it can ever be approved for a client.
export async function openAvailability(query: Query, sessionDate: string) {
  await query(
    `INSERT INTO pf2p_availability (session_date, status) VALUES ($1, 'open')
     ON CONFLICT (session_date) DO UPDATE SET status = 'open', updated_at = now()`,
    [sessionDate],
  );
}

export async function closeAvailability(query: Query, sessionDate: string) {
  await query(
    `INSERT INTO pf2p_availability (session_date, status) VALUES ($1, 'closed')
     ON CONFLICT (session_date) DO UPDATE SET status = 'closed', updated_at = now()`,
    [sessionDate],
  );
}

export async function listAvailability(query: Query) {
  return query(
    `SELECT session_date, status FROM pf2p_availability ORDER BY session_date`,
  );
}

// Owner approves an inquiry against an owner-opened date. Creates a HELD booking
// with a 30-minute window. The unique index on (session_date) for active statuses
// makes double-booking impossible at the database layer, not just in application code.
export async function approveBooking(query: Query, inquiryId: string, sessionDate: string) {
  const available = await query(
    `SELECT 1 FROM pf2p_availability WHERE session_date = $1 AND status = 'open'`,
    [sessionDate],
  );
  if (!available.length) throw new DateUnavailable();

  const holdToken = randomUUID();
  try {
    const rows = await query(
      `INSERT INTO pf2p_bookings
         (inquiry_id, session_date, status, hold_token, hold_expires_at,
          retainer_amount_cents, balance_amount_cents)
       VALUES ($1, $2, 'held', $3, now() + interval '${HOLD_MINUTES} minutes', $4, $5)
       RETURNING id, hold_token, hold_expires_at`,
      [inquiryId, sessionDate, holdToken, RETAINER_CENTS, BALANCE_CENTS],
    );
    return rows[0];
  } catch (error) {
    // Unique violation on the active-date index means another booking already holds this date.
    throw new DateUnavailable();
  }
}

export async function getBooking(query: Query, bookingId: string) {
  const rows = await query(`SELECT * FROM pf2p_bookings WHERE id = $1`, [bookingId]);
  if (!rows.length) throw new BookingNotFound();
  return rows[0];
}

export async function recordAgreementAcceptance(query: Query, bookingId: string, promoPermission: boolean) {
  await query(
    `UPDATE pf2p_bookings SET agreement_accepted_at = now(), promo_use_permission = $2
     WHERE id = $1 AND status = 'held'`,
    [bookingId, promoPermission],
  );
}

export async function attachRetainerCheckout(query: Query, bookingId: string, checkoutSessionId: string) {
  await query(
    `UPDATE pf2p_bookings SET retainer_checkout_session_id = $2, retainer_payment_status = 'pending'
     WHERE id = $1 AND status = 'held'`,
    [bookingId, checkoutSessionId],
  );
}

export async function attachBalanceCheckout(query: Query, bookingId: string, checkoutSessionId: string) {
  await query(
    `UPDATE pf2p_bookings SET balance_checkout_session_id = $2, balance_payment_status = 'pending'
     WHERE id = $1 AND status = 'confirmed'`,
    [bookingId, checkoutSessionId],
  );
}

// Idempotent: records the Stripe event id first; if already seen, returns false
// and the caller should skip processing (protects against Stripe's webhook retries).
export async function recordStripeEventOnce(query: Query, eventId: string, eventType: string) {
  const rows = await query(
    `INSERT INTO pf2p_stripe_events (event_id, event_type) VALUES ($1, $2)
     ON CONFLICT (event_id) DO NOTHING RETURNING event_id`,
    [eventId, eventType],
  );
  return rows.length > 0;
}

export async function markRetainerPaid(query: Query, checkoutSessionId: string) {
  await query(
    `UPDATE pf2p_bookings SET retainer_payment_status = 'paid', status = 'confirmed', updated_at = now()
     WHERE retainer_checkout_session_id = $1 AND status = 'held'`,
    [checkoutSessionId],
  );
}

export async function markBalancePaid(query: Query, checkoutSessionId: string) {
  await query(
    `UPDATE pf2p_bookings SET balance_payment_status = 'paid', status = 'paid_in_full', updated_at = now()
     WHERE balance_checkout_session_id = $1 AND status = 'confirmed'`,
    [checkoutSessionId],
  );
}

export async function expireStaleHolds(query: Query) {
  const rows = await query(
    `UPDATE pf2p_bookings SET status = 'expired', updated_at = now()
     WHERE status = 'held' AND hold_expires_at < now()
     RETURNING id, session_date`,
  );
  return rows;
}

export async function cancelBooking(query: Query, bookingId: string, reason: string) {
  await query(
    `UPDATE pf2p_bookings SET status = 'cancelled', cancelled_at = now(),
       cancellation_reason = $2, updated_at = now()
     WHERE id = $1 AND status IN ('held', 'confirmed', 'paid_in_full')`,
    [bookingId, reason],
  );
}
