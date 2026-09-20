import { getBookingProviders } from "@/lib/booking/providers";
import { getAttemptBySessionId } from "@/lib/booking/payments";
import { getBooking } from "@/lib/booking/bookings";
import { retrieveCheckoutSession } from "@/lib/booking/stripe";

export const dynamic = "force-dynamic";

export default async function PaymentCancelledPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId } = await searchParams;
  const providers = getBookingProviders();
  const attempt = sessionId && providers ? await getAttemptBySessionId(providers.query, sessionId) : null;

  // Don't assume "no charge" — check whether this exact session actually completed
  // (e.g. the client went back after paying, or the webhook processed while they
  // were on this page). If Stripe can't be reached, say so rather than guessing.
  const liveSession = sessionId ? await retrieveCheckoutSession(sessionId) : null;
  const booking = attempt ? await getBooking(providers!.query, attempt.booking_id).catch(() => null) : null;

  if (attempt?.status === "paid" || liveSession?.payment_status === "paid") {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 pb-24 pt-32">
        <div className="max-w-lg text-center">
          <p className="section-label mb-4">Photography Fit 2 Print</p>
          <h1 className="hero-heading text-3xl text-white">Your payment did go through</h1>
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            It looks like this payment actually completed. Please check your booking status — you may not need to pay again.
          </p>
          {attempt && <p className="mt-6 text-xs text-white/35">Reference: {attempt.booking_id}</p>}
        </div>
      </main>
    );
  }

  const statusMessage = sessionId && !liveSession
    ? "We couldn't verify this session's status just now, but no completed payment is on record for it."
    : "No charge was recorded for this attempt.";

  return (
    <main className="flex min-h-screen items-center justify-center px-6 pb-24 pt-32">
      <div className="max-w-lg text-center">
        <p className="section-label mb-4">Photography Fit 2 Print</p>
        <h1 className="hero-heading text-3xl text-white">Payment not completed</h1>
        <p className="mt-4 text-sm leading-relaxed text-white/60">
          {statusMessage} {booking?.status === "held" ? "Your reservation hold remains active until it expires." : ""} You can try
          paying again using the same link, or contact Photography Fit 2 Print if you need help.
        </p>
        {attempt?.payment_type === "retainer" && (
          <a
            href={`/api/booking/pay/retainer/${attempt.booking_id}`}
            className="mt-8 inline-block rounded-full bg-[var(--accent)] px-8 py-4 text-sm font-bold uppercase tracking-widest text-black transition hover:bg-white"
          >
            Try payment again
          </a>
        )}
        {attempt?.payment_type === "balance" && (
          <a
            href={`/api/booking/pay/balance/${attempt.booking_id}`}
            className="mt-8 inline-block rounded-full bg-[var(--accent)] px-8 py-4 text-sm font-bold uppercase tracking-widest text-black transition hover:bg-white"
          >
            Try payment again
          </a>
        )}
      </div>
    </main>
  );
}
