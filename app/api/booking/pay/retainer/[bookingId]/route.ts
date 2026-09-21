import { NextResponse } from "next/server";
import { getBookingProviders } from "@/lib/booking/providers";
import { getBookingFresh, BookingNotFound } from "@/lib/booking/bookings";
import { createCheckoutSession, currentEnvironmentIsLive } from "@/lib/booking/stripe";
import { findReusableAttempt, acquireAttemptSlot, finalizeAttempt, releaseFailedAttemptSlot, AttemptInFlight } from "@/lib/booking/payments";

export const runtime = "nodejs";
export const maxDuration = 30;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const providers = getBookingProviders();
  if (!providers) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  let booking;
  try {
    booking = await getBookingFresh(providers.query, bookingId);
  } catch (error) {
    if (error instanceof BookingNotFound) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
  if (booking.status !== "held") {
    return NextResponse.json({ error: "This reservation is no longer available to pay (expired, already confirmed, or cancelled)." }, { status: 409 });
  }
  const origin = new URL(request.url).origin;
  if (!booking.agreement_accepted_at) {
    return NextResponse.redirect(`${origin}/book/agreement/${bookingId}`, { status: 307 });
  }

  const existing = await findReusableAttempt(providers.query, bookingId, "retainer");
  if (existing && existing.checkout_url) {
    return NextResponse.redirect(existing.checkout_url, { status: 303 });
  }

  // Claim the DB-level slot BEFORE calling Stripe. A partial unique index on
  // (booking_id, payment_type) WHERE status='created' means at most one process
  // can hold this slot; the loser polls for the winner's result instead of also
  // calling Stripe, which is what prevented two sessions under simultaneous visits.
  let placeholderId: string;
  try {
    const claim = await acquireAttemptSlot(providers.query, bookingId, "retainer", currentEnvironmentIsLive());
    placeholderId = claim.placeholderId;
  } catch (error) {
    if (error instanceof AttemptInFlight) {
      for (let i = 0; i < 6; i++) {
        await sleep(500);
        const winner = await findReusableAttempt(providers.query, bookingId, "retainer");
        if (winner && winner.checkout_url) return NextResponse.redirect(winner.checkout_url, { status: 303 });
      }
      return NextResponse.json({ error: "Payment setup is still in progress. Please refresh in a moment." }, { status: 503 });
    }
    return NextResponse.json({ error: "Could not start payment. Please try again." }, { status: 503 });
  }

  try {
    const session = await createCheckoutSession({
      amountCents: booking.retainer_amount_cents,
      productName: "Photography Fit 2 Print — Bespoke Session Reservation Retainer",
      bookingId,
      paymentType: "retainer",
      successUrl: `${origin}/book/confirmed?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/book/payment-cancelled?session_id={CHECKOUT_SESSION_ID}`,
      expiresInSeconds: 1800,
      // Stable per booking+type: if THIS request is retried after a timeout (e.g. by
      // the platform), Stripe returns the same session instead of creating a second one.
      idempotencyKey: `retainer-session:${bookingId}`,
    });
    if (session.livemode !== currentEnvironmentIsLive()) {
      await releaseFailedAttemptSlot(providers.query, placeholderId);
      return NextResponse.json({ error: "Payment environment mismatch. Please contact Photography Fit 2 Print." }, { status: 500 });
    }
    await finalizeAttempt(providers.query, placeholderId, {
      checkoutSessionId: session.id,
      checkoutUrl: session.url,
      amountCents: booking.retainer_amount_cents,
      currency: session.currency,
      expiresAt: session.expiresAt,
    });
    return NextResponse.redirect(session.url, { status: 303 });
  } catch {
    await releaseFailedAttemptSlot(providers.query, placeholderId);
    return NextResponse.json({ error: "Could not start payment. Please try again." }, { status: 503 });
  }
}
