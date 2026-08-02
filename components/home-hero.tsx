import Image from "next/image";
import Link from "next/link";
import { IMAGES, SITE } from "@/lib/site";

export function HomeHero() {
  return (
    <section className="relative flex min-h-screen items-end overflow-hidden pt-24">
      <Image
        src={IMAGES.heroFeatherWings}
        alt="Bold portrait photography"
        fill
        priority
        className="object-cover object-top opacity-80"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-[#0a0a0a]/10" />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-20">
        <p className="fade-up section-label mb-4" style={{ animationDelay: "0.1s" }}>
          {SITE.serviceArea}
        </p>
        <h1
          className="fade-up hero-heading text-6xl text-white md:text-8xl"
          style={{ animationDelay: "0.25s" }}
        >
          Fit to be
          <br />
          Seen.
        </h1>
        <p
          className="fade-up mt-6 max-w-lg text-lg text-white/70"
          style={{ animationDelay: "0.4s" }}
        >
          Bold portrait sessions and museum-grade prints for people who want to be
          remembered — right here in {SITE.location}.
        </p>
        <div className="fade-up mt-8 flex flex-wrap gap-4" style={{ animationDelay: "0.55s" }}>
          <Link
            href="/services"
            className="rounded-full bg-[var(--accent)] px-8 py-4 text-sm font-semibold uppercase tracking-wide text-black transition hover:bg-white"
          >
            Book a Session
          </Link>
          <Link
            href="/portfolio"
            className="rounded-full border border-white/40 px-8 py-4 text-sm font-semibold uppercase tracking-wide text-white transition hover:border-white"
          >
            View Portfolio
          </Link>
        </div>
      </div>
    </section>
  );
}
