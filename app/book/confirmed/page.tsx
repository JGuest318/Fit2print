import { getBookingProviders } from "@/lib/booking/providers";
import { getAttemptBySessionId } from "@/lib/booking/payments";
import { retrieveCheckoutSession } from "@/lib/booking/stripe";

export const dynamic = "force-dynamic";

export default async function ConfirmedPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId } = await searchParams;
  const providers = getBookingProviders();

  if (!sessionId || !providers) {
    return <Status title="Missing reference" message="We couldn't find a payment reference for this page. If you just paid, check your email confirmation or contact Photography Fit 2 Print." />;
  }

  const attempt = await getAttemptBySessionId(providers.query, sessionId);
  if (!attempt) {
    return <Status title="Payment not found" message="We couldn't match this payment to a reservation. Please contact Photography Fit 2 Print with your confirmation email." />;
  }

  // Never trust the redirect alone — confirm the actual payment status with Stripe
  // server-side. The webhook is the source of truth for crediting the booking; this
  // is purely to give the client accurate, verified feedback right now.
  const liveSession = await retrieveCheckoutSession(sessionId);
  const verifiedPaid = liveSession?.payment_status === "paid";

  if (attempt.status === "paid") {
    return (
      <Status
        title="Retainer received"
        message={`Your $${(attempt.amount_cents / 100).toFixed(2)} reservation retainer has been received and your session date is confirmed. A confirmation has been sent, and you'll receive a link to pay the remaining balance on your session day.`}
        reference={attempt.booking_id}
      />
    );
  }

  if (attempt.status === "needs_resolution") {
    return (
      <Status
        title="We're reviewing your payment"
        message="Your payment was received, but we need to manually confirm a detail before finalizing your booking (this can happen if the reservation window changed while you were paying). Photography Fit 2 Print will reach out shortly — your payment has not been lost."
        reference={attempt.booking_id}
      />
    );
  }

  if (verifiedPaid) {
    return (
      <Status
        title="Payment received — finalizing"
        message="Stripe confirms your payment went through. We're finishing confirmation on our side; this usually takes a few seconds. Refresh this page shortly, or check your email for confirmation."
        reference={attempt.booking_id}
      />
    );
  }

  return (
    <Status
      title="Payment not yet confirmed"
      message="We don't see a completed payment for this session yet. If you completed checkout, please wait a moment and refresh; otherwise you can try the payment link again."
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
