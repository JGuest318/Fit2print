import { getBookingProviders } from "@/lib/booking/providers";
import { getAttemptBySessionId } from "@/lib/booking/payments";
import { getBooking } from "@/lib/booking/bookings";
import { retrieveCheckoutSession } from "@/lib/booking/stripe";

export const dynamic = "force-dynamic";

export default async function ConfirmedPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId } = await searchParams;
  const providers = getBookingProviders();

  if (!sessionId || !providers) {
    return <Status title="Missing reference" message="We couldn't find a payment reference for this page. If you just paid, check your booking status or contact Photography Fit 2 Print." />;
  }

  const attempt = await getAttemptBySessionId(providers.query, sessionId);
  if (!attempt) {
    return <Status title="Payment not found" message="We couldn't match this payment to a reservation. Please contact Photography Fit 2 Print." />;
  }

  if (attempt.payment_type !== "retainer") {
    return <Status title="Wrong payment step" message="This link is for the reservation retainer, but this payment was for a different step. Check your booking status or contact Photography Fit 2 Print." reference={attempt.booking_id} />;
  }

  const booking = await getBooking(providers.query, attempt.booking_id).catch(() => null);

  // A booking that was later cancelled or rescheduled still has retainer_payment_status
  // = 'paid' on its own row (by design — it's historical fact), but that must never be
  // shown as an ACTIVE confirmation. Check the current status explicitly.
  if (booking?.status === "cancelled") {
    return (
      <Status
        title="This reservation was cancelled"
        message={booking.cancellation_reason === "rescheduled"
          ? "This session was rescheduled to a new date. Your payment carried forward — no new retainer was charged."
          : "This reservation has since been cancelled. If you have questions about your payment, please contact Photography Fit 2 Print."}
        reference={attempt.booking_id}
      />
    );
  }

  if (booking && (booking.status === "confirmed" || booking.status === "paid_in_full") && booking.retainer_payment_status === "paid") {
    return (
      <Status
        title="Retainer received"
        message={`Your $${(attempt.amount_cents / 100).toFixed(2)} reservation retainer has been received and your session date is confirmed. You'll receive a link to pay the remaining balance on your session day.`}
        reference={attempt.booking_id}
      />
    );
  }

  if (booking?.needs_resolution) {
    return (
      <Status
        title="We're reviewing your payment"
        message="Your payment appears to have gone through, but we need to manually confirm a detail before finalizing your booking. Photography Fit 2 Print will reach out — your payment has not been lost."
        reference={attempt.booking_id}
      />
    );
  }

  const liveSession = await retrieveCheckoutSession(sessionId);
  const verificationUnavailable = liveSession === null;
  const verifiedPaid = liveSession?.payment_status === "paid";

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
