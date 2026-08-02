import type { Metadata } from "next";
import Image from "next/image";
import { Printer, Heart, Award, MapPin } from "lucide-react";
import { FinalCta } from "@/components/final-cta";
import { IMAGES, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About | Meet John Guest, Photographer & Printmaker",
  description:
    "Photography Fit 2 Print is a disabled veteran-owned portrait and fine-art photography studio in Bloomington, Illinois, founded by John Guest.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About | Meet John Guest, Photographer & Printmaker",
    description:
      "Photography Fit 2 Print is a disabled veteran-owned portrait and fine-art photography studio in Bloomington, Illinois, founded by John Guest.",
    url: "/about",
  },
};

const values = [
  { icon: Printer, title: "Museum-Quality Craft", desc: "From capture to fine-art print — every image is prepared to be experienced as tangible artwork, not just viewed on a screen." },
  { icon: Heart, title: "Collaborative Spirit", desc: "Every session is a partnership, so you feel comfortable, confident, and authentically yourself in front of the camera." },
  { icon: Award, title: "Veteran-Owned", desc: "A disabled veteran-owned business built on discipline, attention to detail, and creative vision." },
  { icon: MapPin, title: "Local & Proud", desc: `Based in ${SITE.location}, serving ${SITE.serviceArea}.` },
];

export default function About() {
  return (
    <main className="px-6 pb-24 pt-36">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <p className="section-label mb-4">The Studio</p>
            <h1 className="hero-heading mb-6 text-5xl text-white md:text-6xl">About Fit 2 Print</h1>
            <p className="text-white/70">
              Photography Fit 2 Print, LLC is a portrait and fine-art photography studio
              founded by photographer and printmaker John Guest, dedicated to creating
              images that are not only captured beautifully — but crafted to live as
              lasting works of art.
            </p>
            <p className="mt-4 text-white/70">
              Based in {SITE.location}, the studio specializes in professional headshots,
              portrait sessions, fashion and lifestyle photography, and event coverage,
              all designed to highlight the individuality and story of each subject. Every
              session is approached with a collaborative spirit so clients feel
              comfortable, confident, and authentically themselves.
            </p>
            <p className="mt-4 text-white/70">
              What makes Photography Fit 2 Print unique is its commitment to the complete
              photographic process — from capture to museum-quality print. Images are
              carefully edited and prepared for fine-art printing, ensuring photographs
              are not just viewed on screens but experienced as tangible artwork. Limited
              and open-edition prints are also offered for collectors and clients who want
              photography designed to be displayed and preserved.
            </p>
            <p className="mt-4 text-white/70">
              A disabled veteran-owned business, Photography Fit 2 Print reflects the
              discipline, attention to detail, and creative vision that founder John Guest
              brings from both his professional career and artistic journey. The mission
              is simple: create photographs that look exceptional today and remain
              meaningful for generations.
            </p>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden">
            <Image src={IMAGES.ownerPortrait} alt="John Guest, photographer" fill className="object-cover object-top" />
          </div>
        </div>

        <div className="mt-24 grid gap-8 md:grid-cols-4">
          {values.map((v) => (
            <div key={v.title}>
              <v.icon className="mb-4 h-8 w-8 text-[var(--accent)]" />
              <h3 className="font-[var(--font-display)] text-lg uppercase text-white">{v.title}</h3>
              <p className="mt-2 text-sm text-white/60">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
      <FinalCta />
    </main>
  );
}
