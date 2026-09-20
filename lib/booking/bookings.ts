import { randomUUID } from "node:crypto";
import type { Query } from "./inquiries";

export class DateUnavailable extends Error {}
export class BookingNotFound extends Error {}
export class AgreementNotAcceptable extends Error {}
export class HoldExpiredError extends Error {}
export class RescheduleTargetUnavailable extends Error {}

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
  needs_resolution: boolean;
  rescheduled_from_booking_id: string | null;
  created_at: string;
  updated_at: string;
};

type ApprovedBooking = { id: string; hold_token: string; hold_expires_at: string };

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

async function expireIfStale(query: Query, sessionDate: string): Promise<void> {
  await query(
    `UPDATE pf2p_bookings SET status = 'expired', updated_at = now()
     WHERE session_date = $1 AND status = 'held' AND hold_expires_at < now()`,
    [sessionDate],
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

export async function approveBooking(query: Query, inquiryId: string, sessionDate: string): Promise<ApprovedBooking> {
  await expireIfStale(query, sessionDate);

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

export async function getBookingFresh(query: Query, bookingId: string): Promise<Booking> {
  const existing = await getBooking(query, bookingId);
  if (existing.status === "held" && existing.hold_expires_at && new Date(existing.hold_expires_at) < new Date()) {
    await query(`UPDATE pf2p_bookings SET status = 'expired', updated_at = now() WHERE id = $1 AND status = 'held'`, [bookingId]);
    return getBooking(query, bookingId);
  }
  return existing;
}

export async function recordAgreementAcceptance(
  query: Query,
  bookingId: string,
  agree: boolean,
  promoUsePermission: boolean,
  agreementVersion: string,
  agreementTextHash: string,
): Promise<void> {
  if (!agree) throw new AgreementNotAcceptable();
  const booking = await getBookingFresh(query, bookingId);
  if (booking.status !== "held") throw new HoldExpiredError();
  const rows = await query(
    `UPDATE pf2p_bookings SET agreement_accepted_at = now(), promo_use_permission = $2,
       agreement_version = $3, agreement_text_hash = $4
     WHERE id = $1 AND status = 'held' AND agreement_accepted_at IS NULL
     RETURNING id`,
    [bookingId, promoUsePermission, agreementVersion, agreementTextHash],
  );
  if (!rows.length) throw new AgreementNotAcceptable();
}

export async function cancelBooking(query: Query, bookingId: string, reason: string): Promise<void> {
  await query(
    `UPDATE pf2p_bookings SET status = 'cancelled', cancelled_at = now(),
       cancellation_reason = $2, updated_at = now()
     WHERE id = $1 AND status IN ('held', 'confirmed', 'paid_in_full')`,
    [bookingId, reason],
  );
}

// A paid reschedule must carry the existing payment credit forward, and must be safe
// under concurrency: two simultaneous reschedule requests for the SAME original booking
// (even targeting different new dates) must not both succeed and duplicate the credit.
//
// This runs as ONE atomic statement. `FOR UPDATE` locks the original booking row for the
// duration of the transaction, so a second concurrent call on the same original blocks
// until the first commits — it then re-reads the row fresh and correctly finds it already
// cancelled (no longer confirmed/paid_in_full), so it does nothing rather than creating a
// second replacement. A failure (target date unavailable) leaves the original untouched,
// because the whole statement is one transaction that rolls back cleanly on no-op.
export async function rescheduleBooking(query: Query, originalBookingId: string, newSessionDate: string): Promise<{ newBookingId: string | null }> {
  const rows = await query(
    `WITH locked_original AS (
       SELECT * FROM pf2p_bookings WHERE id = $1 AND status IN ('confirmed', 'paid_in_full') FOR UPDATE
     ),
     expire_stale_target AS (
       UPDATE pf2p_bookings SET status = 'expired', updated_at = now()
       WHERE session_date = $2 AND status = 'held' AND hold_expires_at < now()
       RETURNING 1
     ),
     target_eligible AS (
       SELECT 1
       WHERE EXISTS (SELECT 1 FROM pf2p_availability WHERE session_date = $2 AND status = 'open')
         AND NOT EXISTS (SELECT 1 FROM pf2p_bookings WHERE session_date = $2 AND status IN ('held', 'confirmed', 'paid_in_full'))
         -- forces this CTE to run after expire_stale_target so a just-expired target date counts as free
         AND NOT EXISTS (SELECT 1 FROM expire_stale_target WHERE false)
     ),
     cancel_original AS (
       UPDATE pf2p_bookings SET status = 'cancelled', cancelled_at = now(),
         cancellation_reason = 'rescheduled', updated_at = now()
       WHERE id = (SELECT id FROM locked_original)
         AND EXISTS (SELECT 1 FROM locked_original)
         AND EXISTS (SELECT 1 FROM target_eligible)
       RETURNING *
     ),
     new_booking AS (
       INSERT INTO pf2p_bookings
         (inquiry_id, session_date, status, agreement_accepted_at, agreement_version, agreement_text_hash,
          promo_use_permission, retainer_amount_cents, retainer_payment_status,
          balance_amount_cents, balance_payment_status, rescheduled_from_booking_id)
       SELECT inquiry_id, $2, status, agreement_accepted_at, agreement_version, agreement_text_hash,
              promo_use_permission, retainer_amount_cents, retainer_payment_status,
              balance_amount_cents, balance_payment_status, id
       FROM cancel_original
       RETURNING id
     )
     SELECT (SELECT id FROM new_booking) AS new_booking_id,
            (SELECT count(*) FROM locked_original) AS original_found,
            (SELECT count(*) FROM target_eligible) AS target_was_eligible`,
    [originalBookingId, newSessionDate],
  );
  const row = rows[0] as { new_booking_id: string | null; original_found: string; target_was_eligible: string } | undefined;
  if (!row || Number(row.original_found) === 0 || Number(row.target_was_eligible) === 0 || !row.new_booking_id) {
    throw new RescheduleTargetUnavailable();
  }
  return { newBookingId: row.new_booking_id };
}
