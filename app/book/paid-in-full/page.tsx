import { getBookingProviders } from "@/lib/booking/providers";
import { getAttemptBySessionId } from "@/lib/booking/payments";
import { getBooking } from "@/lib/booking/bookings";
import { retrieveCheckoutSession } from "@/lib/booking/stripe";

export const dynamic = "force-dynamic";

export default async function PaidInFullPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId } = await searchParams;
  const providers = getBookingProviders();

  if (!sessionId || !providers) {
    return <Status title="Missing reference" message="We couldn't find a payment reference for this page. If you just paid, check your booking status or contact Photography Fit 2 Print." />;
  }

  const attempt = await getAttemptBySessionId(providers.query, sessionId);
  if (!attempt) {
    return <Status title="Payment not found" message="We couldn't match this payment to a reservation. Please contact Photography Fit 2 Print." />;
  }

  // This page is specifically for the BALANCE payment. A retainer session landing here
  // must never be told the session is "paid in full" — that was the original defect.
  if (attempt.payment_type !== "balance") {
    return <Status title="Wrong payment step" message="This link is for the remaining balance, but this payment was for the reservation retainer. Check your booking status or contact Photography Fit 2 Print." reference={attempt.booking_id} />;
  }

  const booking = await getBooking(providers.query, attempt.booking_id).catch(() => null);
  const liveSession = await retrieveCheckoutSession(sessionId);
  const verificationUnavailable = liveSession === null;
  const verifiedPaid = liveSession?.payment_status === "paid";

  if (booking && booking.status === "paid_in_full" && booking.balance_payment_status === "paid") {
    return (
      <Status
        title="Paid in full — see you soon"
        message={`Your remaining $${(attempt.amount_cents / 100).toFixed(2)} balance has been received. Your Bespoke Experience is fully paid. We look forward to your session.`}
        reference={attempt.booking_id}
      />
    );
  }

  if (booking?.needs_resolution) {
    return (
      <Status
        title="We're reviewing your payment"
        message="Your payment appears to have gone through, but we need to manually confirm a detail before finalizing. Photography Fit 2 Print will reach out — your payment has not been lost."
        reference={attempt.booking_id}
      />
    );
  }

  if (verificationUnavailable) {
    return (
      <Status
        title="Payment status unavailable right now"
        message="We couldn't verify your payment status at this moment. This does not mean your payment failed — please check back shortly, or contact Photography Fit 2 Print if you're unsure."
        reference={attempt.booking_id}
      />
    );
  }

  if (verifiedPaid) {
    return (
      <Status
        title="Payment received — finalizing"
        message="Stripe confirms your payment went through. We're finishing confirmation on our side; this usually takes a few seconds. Refresh this page shortly."
        reference={attempt.booking_id}
      />
    );
  }

  return (
    <Status
      title="Payment not yet confirmed"
      message="We don't see a completed payment yet. If you completed checkout, please wait a moment and refresh; otherwise you can try the payment link again."
      reference={attempt.booking_id}
    />
  );
}

function Status({ title, message, reference }: { title: string; message: string; reference?: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 pb-24 pt-32">
      <div className="max-w-lg text-center">
        <p className="section-label mb-4">Photography Fit 2 Print</p>
        <h1 className="hero-heading text-3xl text-white">{title}</h1>
        <p className="mt-4 text-sm leading-relaxed text-white/60">{message}</p>
        {reference && <p className="mt-6 text-xs text-white/35">Reference: {reference}</p>}
      </div>
    </main>
  );
}
