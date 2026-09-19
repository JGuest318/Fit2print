import type { Metadata } from "next";
import Link from "next/link";
import { BespokeBookingForm } from "./bespoke-booking-form";

export const metadata: Metadata = {
  title: "Book the Bespoke Experience | Photography Fit 2 Print",
  description:
    "Reserve the Photography Fit 2 Print Bespoke Experience. $995 total, with a $300 reservation retainer due when booking and the remaining $695 due on the session date.",
  alternates: { canonical: "/book" },
};

export default function BookPage() {
  return (
    <main className="min-h-screen pb-24 pt-32">
      <section className="mx-auto max-w-6xl px-6">
        <p className="section-label mb-4">Photography Fit 2 Print</p>
        <h1 className="hero-heading max-w-4xl text-5xl text-white md:text-7xl">
          The Bespoke Experience
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/65">
          A portrait experience built around you. We begin with conversation, prepare with intention,
          photograph three distinct looks, and finish with a carefully curated collection rather than
          an arbitrary image count.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">Experience</p>
            <p className="mt-2 font-[var(--font-display)] text-3xl text-white">$995</p>
          </div>
          <div className="border border-[var(--accent)]/50 bg-white/[0.03] p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">Reservation Retainer</p>
            <p className="mt-2 font-[var(--font-display)] text-3xl text-[var(--accent)]">$300</p>
            <p className="mt-2 text-xs text-white/45">Due when your session is booked.</p>
          </div>
          <div className="border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">Remaining Balance</p>
            <p className="mt-2 font-[var(--font-display)] text-3xl text-white">$695</p>
            <p className="mt-2 text-xs text-white/45">Due on the session date.</p>
          </div>
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <aside>
            <p className="section-label mb-4">What to Expect</p>
            <ol className="space-y-6 text-sm leading-relaxed text-white/65">
              <li><strong className="text-white">01. Choose a session time.</strong><br />You request from PF2P availability. Your time is not confirmed until the required reservation retainer succeeds.</li>
              <li><strong className="text-white">02. We talk.</strong><br />A FaceTime or phone consultation covers what you want the photographs to feel like, wardrobe, location, comfort, and the three looks we will create.</li>
              <li><strong className="text-white">03. We create.</strong><br />Your session is intentionally prepared, with room to change, settle in, and make photographs without rushing through a checklist.</li>
              <li><strong className="text-white">04. We curate.</strong><br />A carefully curated digital collection of 60 professionally finished, high-resolution JPEG files, along with three Platinum Edition numbered signature digital editions.</li>
            </ol>

            <div className="mt-10 border border-white/10 p-6">
              <p className="font-[var(--font-display)] text-xl uppercase text-white">Community &amp; Collaborative</p>
              <p className="mt-3 text-sm leading-relaxed text-white/55">
                Need a different path? Tell us what you hope to create and what would leave you feeling well served. We can talk about whether there is a way to work together.
              </p>
              <Link href="/contact" className="mt-5 inline-block text-xs font-semibold uppercase tracking-widest text-[var(--accent)] hover:text-white">
                Start a Conversation
              </Link>
            </div>
          </aside>

          <section className="border border-white/10 bg-white/[0.025] p-6 sm:p-10">
            <p className="section-label mb-3">Request Your Session</p>
            <h2 className="font-[var(--font-display)] text-3xl uppercase text-white">A few things. Not your life story.</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/50">
              We only ask for what we need to begin. The creative details belong in the conversation that follows.
            </p>
            <BespokeBookingForm />
          </section>
        </div>
      </section>
    </main>
  );
}
