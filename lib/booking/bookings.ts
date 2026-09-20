import { randomUUID } from "node:crypto";
import type { Query } from "./inquiries";

export class DateUnavailable extends Error {}
export class BookingNotFound extends Error {}
export class AgreementNotAcceptable extends Error {}
export class HoldExpiredError extends Error {}

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

// Self-heals any stale held booking on a given date. Called at every stage of the
// flow (approval, agreement acceptance, retainer checkout) so correctness never
// depends on the external hold-expiry scheduler's timing.
async function expireIfStale(query: Query, sessionDate: string): Promise<void> {
  await query(
    `UPDATE pf2p_bookings SET status = 'expired', updated_at = now()
     WHERE session_date = $1 AND status = 'held' AND hold_expires_at < now()`,
    [sessionDate],
  );
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

// Fetches the booking after first self-healing it if its hold has silently expired.
// Every stage that gates on status = 'held' should call this rather than getBooking
// directly, so an unswept expiry can never be mistaken for an active hold.
export async function getBookingFresh(query: Query, bookingId: string): Promise<Booking> {
  const existing = await getBooking(query, bookingId);
  if (existing.status === "held" && existing.hold_expires_at && new Date(existing.hold_expires_at) < new Date()) {
    await query(`UPDATE pf2p_bookings SET status = 'expired', updated_at = now() WHERE id = $1 AND status = 'held'`, [bookingId]);
    return getBooking(query, bookingId);
  }
  return existing;
}

// Requires explicit agreement (agree=true) to record acceptance at all. Promotional-use
// permission is a fully independent boolean — never inferred from general acceptance.
// Records the exact agreement version and text hash so later wording changes can never
// retroactively alter what this client is understood to have accepted. Independently
// enforces the hold expiry — does not rely on the approval-time self-heal alone.
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

export class RescheduleTargetUnavailable extends Error {}

// A paid reschedule must carry the existing payment credit forward — the client must
// never be asked for another retainer just because the date changed. Creates a NEW
// booking row for the new date (self-healing that date first), copies over the paid
// status from the original, links the two via rescheduled_from_booking_id, and
// cancels the original with reason 'rescheduled'.
export async function rescheduleBooking(query: Query, originalBookingId: string, newSessionDate: string): Promise<{ newBookingId: string }> {
  const original = await getBookingFresh(query, originalBookingId);
  if (original.status !== "confirmed" && original.status !== "paid_in_full") {
    throw new RescheduleTargetUnavailable();
  }

  await expireIfStale(query, newSessionDate);
  const available = await query(
    `SELECT 1 FROM pf2p_availability WHERE session_date = $1 AND status = 'open'`,
    [newSessionDate],
  );
  if (!available.length) throw new RescheduleTargetUnavailable();

  let rows: Record<string, unknown>[];
  try {
    rows = await query(
      `INSERT INTO pf2p_bookings
         (inquiry_id, session_date, status, agreement_accepted_at, agreement_version, agreement_text_hash,
          promo_use_permission, retainer_amount_cents, retainer_payment_status,
          balance_amount_cents, balance_payment_status, rescheduled_from_booking_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [
        original.inquiry_id,
        newSessionDate,
        original.status,
        original.agreement_accepted_at,
        original.agreement_version,
        original.agreement_text_hash,
        original.promo_use_permission,
        original.retainer_amount_cents,
        original.retainer_payment_status,
        original.balance_amount_cents,
        original.balance_payment_status,
        originalBookingId,
      ],
    );
  } catch {
    throw new RescheduleTargetUnavailable();
  }
  if (!rows.length) throw new RescheduleTargetUnavailable();

  await cancelBooking(query, originalBookingId, "rescheduled");
  return { newBookingId: String(rows[0].id) };
}
