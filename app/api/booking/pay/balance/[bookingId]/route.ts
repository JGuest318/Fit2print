import { NextResponse } from "next/server";
import { getBookingProviders } from "@/lib/booking/providers";
import { getBookingFresh, BookingNotFound } from "@/lib/booking/bookings";
import { createCheckoutSession, currentEnvironmentIsLive } from "@/lib/booking/stripe";
import { findReusableAttempt, recordAttempt } from "@/lib/booking/payments";

export const runtime = "nodejs";
export const maxDuration = 30;

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
  if (booking.status !== "confirmed") {
    return NextResponse.json({ error: "The remaining balance is not payable yet (retainer not confirmed, already paid, or cancelled)." }, { status: 409 });
  }
  const origin = new URL(request.url).origin;

  const existing = await findReusableAttempt(providers.query, bookingId, "balance");
  if (existing) {
    return NextResponse.redirect(existing.checkout_url, { status: 303 });
  }

  try {
    const session = await createCheckoutSession({
      amountCents: booking.balance_amount_cents,
      productName: "Photography Fit 2 Print — Bespoke Session Remaining Balance",
      bookingId,
      paymentType: "balance",
      successUrl: `${origin}/book/paid-in-full?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/book/payment-cancelled?session_id={CHECKOUT_SESSION_ID}`,
      expiresInSeconds: 3600,
    });
    if (session.livemode !== currentEnvironmentIsLive()) {
      return NextResponse.json({ error: "Payment environment mismatch. Please contact Photography Fit 2 Print." }, { status: 500 });
    }
    await recordAttempt(providers.query, {
      bookingId,
      paymentType: "balance",
      checkoutSessionId: session.id,
      checkoutUrl: session.url,
      amountCents: booking.balance_amount_cents,
      currency: session.currency,
      livemode: session.livemode,
      expiresAt: session.expiresAt,
    });
    return NextResponse.redirect(session.url, { status: 303 });
  } catch {
    return NextResponse.json({ error: "Could not start payment. Please try again." }, { status: 503 });
  }
}
