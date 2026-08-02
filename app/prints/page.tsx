import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FinalCta } from "@/components/final-cta";
import { IMAGES } from "@/lib/site";

export const metadata: Metadata = {
  title: "Print Shop | Fine Art & Museum-Grade Prints",
  description:
    "Order museum-grade fine art paper, canvas, metal, and framed prints from your Photography Fit 2 Print session. Give your photos a home on the wall.",
  alternates: { canonical: "/prints" },
  openGraph: {
    title: "Print Shop | Fine Art & Museum-Grade Prints",
    description:
      "Order museum-grade fine art paper, canvas, metal, and framed prints from your Photography Fit 2 Print session. Give your photos a home on the wall.",
    url: "/prints",
  },
};

const products = [
  { name: "Fine Art Paper Print", price: "From $45", desc: "Archival matte or lustre paper, true-to-color." },
  { name: "Canvas Wrap", price: "From $120", desc: "Gallery-wrapped canvas, ready to hang." },
  { name: "Framed Print", price: "From $150", desc: "Solid wood frame, museum glass, hand-finished." },
  { name: "Metal Print", price: "From $180", desc: "Vivid, modern, and durable — a bold statement piece." },
];

const steps = [
  { step: "01", title: "Choose Your Image", desc: "Pick any photo from your session gallery." },
  { step: "02", title: "Select Your Print", desc: "Paper, canvas, metal, or framed — choose your size and finish." },
  { step: "03", title: "We Print & Ship", desc: "Hand-finished in-house and shipped or ready for studio pickup." },
];

export default function Prints() {
  return (
    <main className="px-6 pb-24 pt-36">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <p className="section-label mb-4">Fit 2 Print</p>
            <h1 className="hero-heading mb-4 text-5xl text-white md:text-7xl">Print Shop</h1>
            <p className="max-w-xl text-white/60">
              Millions of photos are taken every day that never see the light — trapped
              on servers, phones, and hard drives. A print can stir a memory, spark a
              connection, and give your art a home. Museum-grade prints, produced and
              finished in-house, because your photos deserve more than a hard drive.
            </p>
            <Link
              href="/contact"
              className="mt-8 inline-block rounded-full bg-[var(--accent)] px-8 py-4 text-sm font-semibold uppercase tracking-wide text-black transition hover:bg-white"
            >
              Order Prints
            </Link>
          </div>
          <div className="relative aspect-[2/3] overflow-hidden">
            <Image src={IMAGES.printHero} alt="Liberate your photos — print what matters" fill className="object-cover" priority />
          </div>
        </div>

        <div className="mt-24 grid gap-6 md:grid-cols-4">
          {products.map((p) => (
            <div key={p.name} className="border border-white/10 p-6">
              <h3 className="font-[var(--font-display)] text-xl uppercase text-white">{p.name}</h3>
              <p className="mt-2 font-[var(--font-display)] text-2xl text-[var(--accent)]">{p.price}</p>
              <p className="mt-3 text-sm text-white/60">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="relative mt-20 aspect-[21/9] overflow-hidden">
          <Image src={IMAGES.howItWorks} alt="How it works — order prints" fill className="object-cover" />
        </div>

        <div className="mt-20">
          <p className="section-label mb-4">How It Works</p>
          <h2 className="hero-heading mb-10 text-3xl text-white md:text-4xl">Ordering Process</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.step}>
                <p className="font-[var(--font-display)] text-5xl text-white/20">{s.step}</p>
                <h3 className="mt-2 font-[var(--font-display)] text-xl uppercase text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-white/60">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 text-center">
          <Link
            href="/contact"
            className="inline-block rounded-full bg-[var(--accent)] px-8 py-4 text-sm font-semibold uppercase tracking-wide text-black transition hover:bg-white"
          >
            Order Prints
          </Link>
        </div>
      </div>
      <FinalCta />
    </main>
  );
}
