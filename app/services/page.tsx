import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FinalCta } from "@/components/final-cta";
import { IMAGES } from "@/lib/site";

export const metadata: Metadata = {
  title: "Book a Session | Pricing & Packages",
  description:
    "Portrait session packages starting at $400 in Bloomington, IL. Compare The Portrait Experience, The Signature Collection, and The Heirloom Collection and book your session today.",
  alternates: { canonical: "/services" },
  openGraph: {
    title: "Book a Session | Pricing & Packages",
    description:
      "Portrait session packages starting at $400 in Bloomington, IL. Compare The Portrait Experience, The Signature Collection, and The Heirloom Collection and book your session today.",
    url: "/services",
  },
};

const tiers = [
  {
    eyebrow: "TIER ONE",
    name: "The Portrait Experience",
    price: "$400",
    tagline:
      "A true portrait session, done right — for the person who wants to look and feel like themselves, elevated.",
    features: [
      "15–20 min concept consultation (phone or FaceTime)",
      "Up to 60-minute session, single location",
      "22 color-corrected digital images, private online gallery",
      "2 Fit2Print Signature Retouching images",
      "1× 8x10 fine art print",
    ],
    amenityNote: "Basic touch-up station between looks",
    cta: "Book the Portrait Experience",
  },
  {
    eyebrow: "TIER TWO",
    name: "The Signature Collection",
    price: "$600",
    priceNote: "Most Booked",
    tagline:
      "For the client who wants to plan it with us — a fuller gallery, deeper retouching, and prints worth framing.",
    features: [
      "Full in-person or FaceTime planning consultation",
      "Extended session, up to 2 locations",
      "40 color-corrected digital images",
      "5 Fit2Print Signature Retouching images",
      "1× 13x19 print + 2× 5x7 prints",
    ],
    amenityNote: "Dedicated touch-up station + referral artist option, elevated refreshments",
    cta: "Book the Signature Collection",
    featured: true,
  },
];

const heirloom = {
  eyebrow: "TIER THREE — BY CONSULTATION",
  name: "The Heirloom Collection",
  price: "$1,300",
  priceNote: "starting at",
  tagline:
    "Museum-scale art, made for the wall your family gathers around for generations. This tier begins with a conversation, not a checkout button.",
  features: [
    "Full in-person consultation + an in-home wall-space consultation, including a digital room mockup before anything is printed",
    "Up to 3-hour session, unlimited looks/locations within reason",
    "70+ color-corrected digital images",
    "10 Fit2Print Signature Retouching images",
    "1 large-format heirloom piece — your choice of 24x36 canvas gallery wrap, metal print, or museum-framed fine art",
    "2 companion keepsake prints",
    "Heirloom presentation box",
  ],
  upgrades: [
    "Upsize to 30x40 or larger",
    "A second statement piece (companion or triptych set)",
    "Museum-grade framing upgrade",
    "Heirloom leather-bound album",
    "White-glove in-home installation",
  ],
  cta: "Schedule a Heirloom Consultation",
};

const studioStandard = [
  "Refreshments on arrival",
  "A private changing area, with robe, for wardrobe changes",
  "Curated music and mood lighting",
  "Comfortable seating for the people who came to support you",
  "White-glove scheduling — text-based confirmations, easy rescheduling",
  "A post-session debrief, walking you through your favorites before you leave",
];

const addOns = [
  { label: "Extra edited image", price: "$15" },
  { label: "Hair & makeup referral booking", price: "Free" },
  { label: "Second outfit", price: "$40" },
  { label: "Extra location", price: "$50" },
  { label: "Rush 24-hour gallery delivery", price: "$75" },
  { label: "Print release for all images", price: "$100" },
];

export default function Services() {
  return (
    <main className="pb-24">
      <section className="relative flex h-[60vh] min-h-[420px] items-end overflow-hidden px-6 pb-12 pt-36">
        <Image
          src={IMAGES.bookSession}
          alt="Book a photography session"
          fill
          priority
          className="object-cover object-[50%_25%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-[#0a0a0a]/10" />
        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <p className="section-label mb-4">Sessions &amp; Packages</p>
          <h1 className="hero-heading text-5xl text-white md:text-7xl">Book a Session</h1>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 pt-16">
        {/* Included in every session */}
        <div className="border border-white/10 bg-white/[0.03] p-10 sm:p-14">
          <div className="grid gap-10 md:grid-cols-[1fr_1.4fr] md:items-center">
            <div>
              <p className="section-label mb-4">Included In Every Session</p>
              <h2 className="hero-heading text-3xl text-white md:text-4xl">
                The Fit2Print
                <br />
                Standard
              </h2>
              <p className="mt-5 text-white/60 italic">
                This isn&rsquo;t an upgrade. It&rsquo;s simply how we do things.
              </p>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {studioStandard.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-white/80">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tier one + two */}
        <div className="mt-16">
          <p className="section-label mb-4">Choose Your Tier</p>
          <div className="grid gap-6 md:grid-cols-2">
            {tiers.map((t) => (
              <div
                key={t.name}
                className={`relative flex flex-col border p-8 ${
                  t.featured ? "border-[var(--accent)] bg-white/5" : "border-white/10"
                }`}
              >
                {t.priceNote && (
                  <span className="absolute -top-3 left-8 bg-[var(--accent)] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-black">
                    {t.priceNote}
                  </span>
                )}
                <p className="section-label mb-2">{t.eyebrow}</p>
                <h2 className="font-[var(--font-display)] text-2xl uppercase text-white">{t.name}</h2>
                <p className="mt-4 font-[var(--font-display)] text-4xl text-[var(--accent)]">{t.price}</p>
                <p className="mt-4 text-sm leading-relaxed text-white/60">{t.tagline}</p>

                <div className="my-6 h-px w-full bg-white/10" />

                <ul className="flex-1 space-y-3 text-sm text-white/70">
                  {t.features.map((f) => (
                    <li key={f}>— {f}</li>
                  ))}
                </ul>

                <p className="mt-6 border border-white/10 bg-white/5 px-4 py-3 text-xs leading-relaxed text-white/50">
                  {t.amenityNote}
                </p>

                <Link
                  href="/contact"
                  className={`mt-8 rounded-full px-6 py-3 text-center text-sm font-semibold uppercase tracking-wide transition ${
                    t.featured
                      ? "bg-[var(--accent)] text-black hover:bg-white"
                      : "border border-white/40 text-white hover:border-white"
                  }`}
                >
                  {t.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Heirloom tier */}
        <div className="mt-16 border border-white/10 bg-white/[0.03] p-10 sm:p-14">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="section-label mb-3">{heirloom.eyebrow}</p>
              <h2 className="hero-heading text-4xl text-white sm:text-5xl">{heirloom.name}</h2>
              <p className="mt-6 text-xl italic leading-snug text-[var(--accent)] sm:text-2xl">
                {heirloom.tagline}
              </p>

              <div className="mt-10 flex items-end gap-3">
                <span className="text-xs uppercase tracking-widest text-white/50">{heirloom.priceNote}</span>
                <span className="font-[var(--font-display)] text-6xl text-white sm:text-7xl">
                  {heirloom.price}
                </span>
              </div>

              <Link
                href="/contact"
                className="mt-10 inline-block rounded-full bg-[var(--accent)] px-8 py-4 text-sm font-semibold uppercase tracking-wide text-black transition hover:bg-white"
              >
                {heirloom.cta}
              </Link>
              <p className="mt-4 text-xs italic text-white/40">
                No self-checkout for this tier — every Heirloom booking begins with a conversation.
              </p>
            </div>

            <div className="space-y-8 border-t border-white/10 pt-8 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
              <div>
                <p className="section-label mb-4">What&rsquo;s Included</p>
                <ul className="space-y-3 text-sm leading-relaxed text-white/80">
                  {heirloom.features.map((f) => (
                    <li key={f}>— {f}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="section-label mb-4">Ready To Scale Up?</p>
                <ul className="flex flex-wrap gap-2">
                  {heirloom.upgrades.map((u) => (
                    <li
                      key={u}
                      className="border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/70"
                    >
                      {u}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Add-ons + custom quote */}
        <div className="mt-16 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
          <div className="border border-white/10 p-8">
            <h3 className="font-[var(--font-display)] text-2xl uppercase text-white">
              Add-Ons &amp; Extras
            </h3>
            <p className="mt-2 text-sm text-white/50">Available on Tier One &amp; Tier Two bookings.</p>
            <ul className="mt-6 divide-y divide-white/10">
              {addOns.map((a) => (
                <li key={a.label} className="flex items-center justify-between py-3 text-sm">
                  <span className="text-white/80">{a.label}</span>
                  <span className="font-[var(--font-display)] text-lg text-[var(--accent)]">{a.price}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col justify-center border border-white/10 bg-white/5 p-8 text-center">
            <h3 className="font-[var(--font-display)] text-2xl uppercase text-white">
              Need Something Custom?
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              Events, commercial work, or brand shoots — let&rsquo;s talk.
            </p>
            <Link
              href="/contact"
              className="mx-auto mt-6 inline-block rounded-full border border-white/40 px-7 py-3 text-xs font-semibold uppercase tracking-widest text-white transition hover:border-white"
            >
              Get a Custom Quote
            </Link>
          </div>
        </div>
      </div>

      <FinalCta />
    </main>
  );
}