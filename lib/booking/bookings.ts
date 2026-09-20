import { randomUUID } from "node:crypto";
import type { Query } from "./inquiries";

export class DateUnavailable extends Error {}
export class BookingNotFound extends Error {}
export class AgreementNotAcceptable extends Error {}

const HOLD_MINUTES = 30;
const RETAINER_CENTS = 30000;
const BALANCE_CENTS = 69500;

export type BookingStatus = "pending_approval" | "held" | "confirmed" | "paid_in_full" | "cancelled" | "expired";
export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";

export type Booking = {
  id: string;
  inquiry_id: string;
  session_date: string;
  status: BookingStatus;
  hold_token: string | null;
  hold_expires_at: string | null;
  agreement_accepted_at: string | null;
  agreement_version: string | null;
  agreement_text_hash: string | null;
  promo_use_permission: boolean;
  retainer_amount_cents: number;
  retainer_checkout_session_id: string | null;
  retainer_payment_status: PaymentStatus;
  balance_amount_cents: number;
  balance_checkout_session_id: string | null;
  balance_payment_status: PaymentStatus;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
};

type ApprovedBooking = { id: string; hold_token: string; hold_expires_at: string };

// Owner explicitly opens a date before it can ever be approved for a client.
export async function openAvailability(query: Query, sessionDate: string): Promise<void> {
  await query(
    `INSERT INTO pf2p_availability (session_date, status) VALUES ($1, 'open')
     ON CONFLICT (session_date) DO UPDATE SET status = 'open', updated_at = now()`,
    [sessionDate],
  );
}

export async function closeAvailability(query: Query, sessionDate: string): Promise<void> {
  await query(
    `INSERT INTO pf2p_availability (session_date, status) VALUES ($1, 'closed')
     ON CONFLICT (session_date) DO UPDATE SET status = 'closed', updated_at = now()`,
    [sessionDate],
  );
}

export async function listAvailability(query: Query): Promise<Array<{ session_date: string; status: string }>> {
  const rows = await query(`SELECT session_date, status FROM pf2p_availability ORDER BY session_date`);
  return rows as Array<{ session_date: string; status: string }>;
}

// Owner approves an inquiry against an owner-opened date. Creates a HELD booking
// with a 30-minute window. The unique index on (session_date) for active statuses
// makes double-booking impossible at the database layer, not just in application code.
//
// IMPORTANT: correctness does not depend on the external hold-expiry scheduler having
// run recently. Third-party/GitHub Actions schedules on short intervals are not reliably
// on-time (observed real gaps of hours between runs). So this function first self-heals
// any stale held booking on the requested date — the scheduler is a cleanup/reporting
// convenience, never a correctness requirement.
export async function approveBooking(query: Query, inquiryId: string, sessionDate: string): Promise<ApprovedBooking> {
  await query(
    `UPDATE pf2p_bookings SET status = 'expired', updated_at = now()
     WHERE session_date = $1 AND status = 'held' AND hold_expires_at < now()`,
    [sessionDate],
  );

  const available = await query(
    `SELECT 1 FROM pf2p_availability WHERE session_date = $1 AND status = 'open'`,
    [sessionDate],
  );
  if (!available.length) throw new DateUnavailable();

  const holdToken = randomUUID();
  let rows: Record<string, unknown>[];
  try {
    rows = await query(
      `INSERT INTO pf2p_bookings
         (inquiry_id, session_date, status, hold_token, hold_expires_at,
          retainer_amount_cents, balance_amount_cents)
       VALUES ($1, $2, 'held', $3, now() + interval '${HOLD_MINUTES} minutes', $4, $5)
       RETURNING id, hold_token, hold_expires_at`,
      [inquiryId, sessionDate, holdToken, RETAINER_CENTS, BALANCE_CENTS],
    );
  } catch {
    // Unique violation on the active-date index means another booking already holds this date.
    throw new DateUnavailable();
  }
  if (!rows.length) throw new DateUnavailable();
  const row = rows[0];
  return { id: String(row.id), hold_token: String(row.hold_token), hold_expires_at: String(row.hold_expires_at) };
}

export async function getBooking(query: Query, bookingId: string): Promise<Booking> {
  const rows = await query(`SELECT * FROM pf2p_bookings WHERE id = $1`, [bookingId]);
  if (!rows.length) throw new BookingNotFound();
  return rows[0] as unknown as Booking;
}

// Requires explicit agreement (agree=true) to record acceptance at all. Promotional-use
// permission is a fully independent boolean — never inferred from general acceptance.
// Records the exact agreement version and text hash so later wording changes can never
// retroactively alter what this client is understood to have accepted.
export async function recordAgreementAcceptance(
  query: Query,
  bookingId: string,
  agree: boolean,
  promoUsePermission: boolean,
  agreementVersion: string,
  agreementTextHash: string,
): Promise<void> {
  if (!agree) throw new AgreementNotAcceptable();
  const rows = await query(
    `UPDATE pf2p_bookings SET agreement_accepted_at = now(), promo_use_permission = $2,
       agreement_version = $3, agreement_text_hash = $4
     WHERE id = $1 AND status = 'held' AND agreement_accepted_at IS NULL
     RETURNING id`,
    [bookingId, promoUsePermission, agreementVersion, agreementTextHash],
  );
  if (!rows.length) throw new AgreementNotAcceptable();
}

export async function attachRetainerCheckout(query: Query, bookingId: string, checkoutSessionId: string): Promise<void> {
  await query(
    `UPDATE pf2p_bookings SET retainer_checkout_session_id = $2, retainer_payment_status = 'pending'
     WHERE id = $1 AND status = 'held'`,
    [bookingId, checkoutSessionId],
  );
}

export async function attachBalanceCheckout(query: Query, bookingId: string, checkoutSessionId: string): Promise<void> {
  await query(
    `UPDATE pf2p_bookings SET balance_checkout_session_id = $2, balance_payment_status = 'pending'
     WHERE id = $1 AND status = 'confirmed'`,
    [bookingId, checkoutSessionId],
  );
}

// Idempotent: records the Stripe event id first; if already seen, returns false
// and the caller should skip processing (protects against Stripe's webhook retries).
export async function recordStripeEventOnce(query: Query, eventId: string, eventType: string): Promise<boolean> {
  const rows = await query(
    `INSERT INTO pf2p_stripe_events (event_id, event_type) VALUES ($1, $2)
     ON CONFLICT (event_id) DO NOTHING RETURNING event_id`,
    [eventId, eventType],
  );
  return rows.length > 0;
}

export async function markRetainerPaid(query: Query, checkoutSessionId: string): Promise<void> {
  await query(
    `UPDATE pf2p_bookings SET retainer_payment_status = 'paid', status = 'confirmed', updated_at = now()
     WHERE retainer_checkout_session_id = $1 AND status = 'held'`,
    [checkoutSessionId],
  );
}

export async function markBalancePaid(query: Query, checkoutSessionId: string): Promise<void> {
  await query(
    `UPDATE pf2p_bookings SET balance_payment_status = 'paid', status = 'paid_in_full', updated_at = now()
     WHERE balance_checkout_session_id = $1 AND status = 'confirmed'`,
    [checkoutSessionId],
  );
}

export async function expireStaleHolds(query: Query): Promise<Array<{ id: string; session_date: string }>> {
  const rows = await query(
    `UPDATE pf2p_bookings SET status = 'expired', updated_at = now()
     WHERE status = 'held' AND hold_expires_at < now()
     RETURNING id, session_date`,
  );
  return rows as Array<{ id: string; session_date: string }>;
}

export async function cancelBooking(query: Query, bookingId: string, reason: string): Promise<void> {
  await query(
    `UPDATE pf2p_bookings SET status = 'cancelled', cancelled_at = now(),
       cancellation_reason = $2, updated_at = now()
     WHERE id = $1 AND status IN ('held', 'confirmed', 'paid_in_full')`,
    [bookingId, reason],
  );
}
