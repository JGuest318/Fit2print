import Link from "next/link";

export function FinalCta() {
  return (
    <section className="border-t border-white/10 px-6 py-24 text-center">
      <h2 className="hero-heading text-4xl text-white md:text-6xl">Ready To Be Seen?</h2>
      <p className="mx-auto mt-4 max-w-xl text-white/60">
        Sessions are booking now for {new Date().getFullYear()}. Let's make something bold together.
      </p>
      <Link
        href="/contact"
        className="mt-8 inline-block rounded-full bg-[var(--accent)] px-8 py-4 text-sm font-semibold uppercase tracking-wide text-black transition hover:bg-white"
      >
        Get In Touch
      </Link>
    </section>
  );
}
