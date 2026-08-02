import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@/lib/site";

export function PrintCta() {
  return (
    <section className="relative overflow-hidden px-6 py-32">
      <Image src={IMAGES.screenToWall} alt="From screen to wall" fill className="object-cover opacity-90" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(10,10,10,0.35)_55%,rgba(10,10,10,0.85)_100%)]" />
      <div className="absolute inset-0 bg-[#0a0a0a]/25" />
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <p className="section-label mb-4">From Screen To Wall</p>
        <h2 className="hero-heading text-4xl text-white md:text-6xl">
          Your Photos Deserve To Be Printed.
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-white/70">
          Museum-grade paper, canvas, metal, and framed prints — produced and finished
          in-house for gallery-quality results every time.
        </p>
        <Link
          href="/prints"
          className="mt-8 inline-block rounded-full bg-[var(--accent)] px-8 py-4 text-sm font-semibold uppercase tracking-wide text-black transition hover:bg-white"
        >
          Shop Prints
        </Link>
      </div>
    </section>
  );
}
