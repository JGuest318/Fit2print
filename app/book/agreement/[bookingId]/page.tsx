import { getBookingProviders } from "@/lib/booking/providers";
import { getBookingFresh, BookingNotFound } from "@/lib/booking/bookings";
import { AGREEMENT_TEXT } from "@/lib/booking/agreement";
import { AgreementForm } from "./agreement-form";

export const dynamic = "force-dynamic";

function formatSessionDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

export default async function AgreementPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const providers = getBookingProviders();

  if (!providers) {
    return <StatusPage title="Not available" message="Online booking is not available right now." />;
  }

  try {
    const booking = await getBookingFresh(providers.query, bookingId);

    if (booking.agreement_accepted_at) {
      return (
        <StatusPage
          title="Already accepted"
          message="This agreement has already been accepted for this reservation."
          action={{ href: `/api/booking/pay/retainer/${bookingId}`, label: "Continue to payment" }}
        />
      );
    }

    if (booking.status !== "held") {
      return (
        <StatusPage
          title="Reservation no longer active"
          message="This reservation is no longer active (it may have expired, already been confirmed, or been cancelled). Please contact Photography Fit 2 Print to start a new request."
        />
      );
    }

    return (
      <main className="min-h-screen pb-24 pt-32">
        <section className="mx-auto max-w-3xl px-6">
          <p className="section-label mb-4">Photography Fit 2 Print</p>
          <h1 className="hero-heading max-w-2xl text-4xl text-white md:text-5xl">Your Bespoke Experience Agreement</h1>
          <p className="mt-4 text-sm text-white/50">
            Session date: <span className="text-white">{formatSessionDate(booking.session_date)}</span>. Please read the
            terms below before continuing to the reservation retainer.
          </p>

          <pre className="mt-10 whitespace-pre-wrap border border-white/10 bg-white/[0.025] p-6 text-sm leading-relaxed text-white/70 font-sans">
            {AGREEMENT_TEXT}
          </pre>

          <AgreementForm bookingId={bookingId} />
        </section>
      </main>
    );
  } catch (error) {
    if (error instanceof BookingNotFound) {
      return <StatusPage title="Reservation not found" message="We couldn't find this reservation. Please check the link or contact Photography Fit 2 Print." />;
    }
    return <StatusPage title="Something went wrong" message="Please try again in a moment." />;
  }
}

function StatusPage({ title, message, action }: { title: string; message: string; action?: { href: string; label: string } }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 pb-24 pt-32">
      <div className="max-w-lg text-center">
        <h1 className="hero-heading text-3xl text-white">{title}</h1>
        <p className="mt-4 text-sm leading-relaxed text-white/60">{message}</p>
        {action && (
          <a
            href={action.href}
            className="mt-8 inline-block rounded-full bg-[var(--accent)] px-8 py-4 text-sm font-bold uppercase tracking-widest text-black transition hover:bg-white"
          >
            {action.label}
          </a>
        )}
      </div>
    </main>
  );
}
