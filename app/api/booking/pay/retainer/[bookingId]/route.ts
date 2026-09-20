import { NextResponse } from "next/server";
import { getBookingProviders } from "@/lib/booking/providers";
import { getBooking, attachRetainerCheckout, BookingNotFound } from "@/lib/booking/bookings";
import { createCheckoutSession } from "@/lib/booking/stripe";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const providers = getBookingProviders();
  if (!providers) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  let booking;
  try {
    booking = await getBooking(providers.query, bookingId);
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
  try {
    const session = await createCheckoutSession({
      amountCents: booking.retainer_amount_cents,
      productName: "Photography Fit 2 Print — Bespoke Session Reservation Retainer",
      bookingId,
      paymentType: "retainer",
      successUrl: `${origin}/book/confirmed?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/book/payment-cancelled`,
      expiresInSeconds: 1800,
    });
    await attachRetainerCheckout(providers.query, bookingId, session.id);
    return NextResponse.redirect(session.url, { status: 303 });
  } catch {
    return NextResponse.json({ error: "Could not start payment. Please try again." }, { status: 503 });
  }
}
