import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FinalCta } from "@/components/final-cta";
import { IMAGES } from "@/lib/site";

export const metadata: Metadata = {
  title: "The Bespoke Experience | Photography Fit 2 Print",
  description: "The Photography Fit 2 Print Bespoke Experience is a $995 intentionally planned portrait experience with a $300 reservation retainer and $695 remaining balance due on the session date.",
  alternates: { canonical: "/services" },
};

const included = [
  "FaceTime or phone consultation to discuss the photographs, wardrobe, location, and comfort",
  "Three distinct looks shaped through clothing, styling, mood, lighting, and expression",
  "A clean, safe, intentionally prepared location with a private place to change",
  "Bottled water and simple hospitality where practical",
  "A carefully curated, professionally finished high-resolution digital collection",
  "Three Platinum Edition signature images receiving PF2P's highest finishing attention",
];

export default function Services() {
  return (
    <main className="pb-24">
      <section className="relative flex h-[60vh] min-h-[420px] items-end overflow-hidden px-6 pb-12 pt-36">
        <Image src={IMAGES.bookSession} alt="Photography Fit 2 Print portrait experience" fill priority className="object-cover object-[50%_25%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-[#0a0a0a]/10" />
        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <p className="section-label mb-4">Fit 2 Capture. Fit 2 Curate. Fit 2 Print.</p>
          <h1 className="hero-heading max-w-5xl text-5xl text-white md:text-7xl">The Bespoke Experience</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/70">Not a stack of packages. One intentionally prepared portrait experience, built around the person in front of the camera.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pt-16">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="section-label mb-4">The Experience</p>
            <h2 className="hero-heading text-4xl text-white md:text-5xl">We begin with conversation.</h2>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/60">Before the camera comes out, we talk about what you want the photographs to feel like. We consider wardrobe, location, comfort, and the three looks we will create. On session day, the space is prepared so you can settle in and make photographs rather than rush through a checklist.</p>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2">
              {included.map((item) => <li key={item} className="border border-white/10 bg-white/[0.025] p-5 text-sm leading-relaxed text-white/70">{item}</li>)}
            </ul>
          </div>

          <aside className="border border-[var(--accent)]/40 bg-white/[0.035] p-8 sm:p-10">
            <p className="section-label mb-3">Bespoke Experience</p>
            <p className="font-[var(--font-display)] text-6xl text-white">$995</p>
            <div className="my-7 h-px bg-white/10" />
            <div className="space-y-5 text-sm leading-relaxed">
              <div><p className="font-semibold text-[var(--accent)]">$300 Reservation Retainer</p><p className="text-white/50">Required to confirm an available session and begin the engagement.</p></div>
              <div><p className="font-semibold text-white">$695 Remaining Balance</p><p className="text-white/50">Due on the session date.</p></div>
            </div>
            <Link href="/book" className="mt-9 block rounded-full bg-[var(--accent)] px-8 py-4 text-center text-sm font-bold uppercase tracking-widest text-black transition hover:bg-white">Book the Bespoke Experience</Link>
            <p className="mt-4 text-center text-xs leading-relaxed text-white/35">Choosing a date does not by itself confirm a booking. Confirmation follows the approved reservation process.</p>
          </aside>
        </div>

        <div className="mt-20 border border-white/10 bg-white/[0.025] p-8 sm:p-12">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="section-label mb-3">Community &amp; Collaborative Sessions</p>
              <h2 className="font-[var(--font-display)] text-3xl uppercase text-white">Start with a conversation.</h2>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/60">Tell us what you are hoping to create and what would leave you feeling well served. We can discuss what Photography Fit 2 Print can reasonably provide and whether there is a way for us to work together. Scope can change. The standard of care does not.</p>
            </div>
            <Link href="/contact" className="inline-block rounded-full border border-white/40 px-8 py-4 text-center text-xs font-semibold uppercase tracking-widest text-white transition hover:border-[var(--accent)] hover:text-[var(--accent)]">Start a Conversation</Link>
          </div>
        </div>
      </section>

      <FinalCta />
    </main>
  );
}
