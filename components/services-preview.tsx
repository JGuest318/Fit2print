import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@/lib/site";

const items = [
  { title: "Portrait Sessions", img: IMAGES.businesswoman, desc: "Editorial-grade portraits for individuals and professionals." },
  { title: "Family Sessions", img: IMAGES.communityEvent, desc: "Warm, timeless family galleries shot on location or in-studio." },
  { title: "Senior Sessions", img: IMAGES.senior, desc: "Bold, memorable senior portraits worth printing big." },
];

export function ServicesPreview() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <p className="section-label mb-4">What We Shoot</p>
        <h2 className="hero-heading mb-12 text-4xl text-white md:text-5xl">Services</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((it) => (
            <Link
              key={it.title}
              href="/services"
              className="group relative aspect-[3/4] overflow-hidden bg-white/5"
            >
              <Image src={it.img} alt={it.title} fill className="object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <h3 className="font-[var(--font-display)] text-2xl uppercase text-white">{it.title}</h3>
                <p className="mt-2 text-sm text-white/70">{it.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
