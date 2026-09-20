import { getBookingProviders } from "@/lib/booking/providers";
import { getAttemptBySessionId } from "@/lib/booking/payments";

export const dynamic = "force-dynamic";

export default async function PaymentCancelledPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId } = await searchParams;
  const providers = getBookingProviders();
  const attempt = sessionId && providers ? await getAttemptBySessionId(providers.query, sessionId) : null;

  return (
    <main className="flex min-h-screen items-center justify-center px-6 pb-24 pt-32">
      <div className="max-w-lg text-center">
        <p className="section-label mb-4">Photography Fit 2 Print</p>
        <h1 className="hero-heading text-3xl text-white">Payment not completed</h1>
        <p className="mt-4 text-sm leading-relaxed text-white/60">
          No charge was made. Your reservation hold remains active until it expires. You can try paying again using the same
          link, or contact Photography Fit 2 Print if you need help.
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
