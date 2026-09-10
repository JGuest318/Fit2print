import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FinalCta } from "@/components/final-cta";

const PHOTO_TABLE = "/photos/2F3A5231.jpg";
const PHOTO_CUSTOMERS = "/photos/2F3A5243.jpg";
const PHOTO_TRUCK = "/photos/2F3A5239.jpg";

export const metadata: Metadata = {
  title: "Hink’s Smokehouse: From Folding Table to Food Truck | Behind The Print",
  description:
    "A Bloomington Farmers’ Market neighbor grows from bottles on a folding table to a full food truck — a small story about consistency, hard work, and recognizing growth around us.",
  alternates: { canonical: "/blog/hinks-smokehouse-from-folding-table-to-food-truck" },
};

function Photo({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  return (
    <figure className="my-10">
      {/* The source photographs are presented unchanged. */}
      <img
        src={src}
        alt={alt}
        width={2389}
        height={1594}
        loading="lazy"
        className="h-auto w-full rounded-lg"
      />
      <figcaption className="mt-3 text-sm text-white/50">
        <span className="block">{caption}</span>
        <span className="mt-1 block text-xs text-white/35">
          Photograph by John Guest, Photography Fit 2 Print.
        </span>
      </figcaption>
    </figure>
  );
}

export default function HinksSmokehousePost() {
  return (
    <main className="px-6 pb-24 pt-36">
      <article className="mx-auto max-w-2xl">
        <Link
          href="/blog"
          className="mb-10 inline-flex items-center gap-2 text-sm uppercase tracking-widest text-white/50 transition hover:text-[var(--accent)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Behind The Print
        </Link>

        <p className="section-label mb-4">September 8, 2026</p>
        <h1 className="hero-heading mb-10 text-4xl text-white md:text-5xl">
          Hink’s Smokehouse: From Folding Table to Food Truck
        </h1>

        <div className="space-y-6 text-base leading-relaxed text-white/70 md:text-lg">
          <p>
            I remember stopping at Hink’s Smokehouse at the Downtown Bloomington Farmers’ Market years ago and grabbing a couple bottles of their early offerings. One bottle of Original Bourbon BBQ Sauce and one of the spicy. Nothing complicated about it. A folding table, bottles of sauce lined up for people to taste, and somebody standing behind a product they believed in.
          </p>
          <p>And then they kept showing up.</p>
          <p>
            Year after year, Hink’s became one of those familiar parts of the Square. The sauce was consistently good, but looking back at these photographs made me realize I had been watching something else happen right in front of me. I was watching a small local business grow.
          </p>

          <Photo
            src={PHOTO_TABLE}
            alt="Hink’s Smokehouse sauces arranged across a vendor table at the Downtown Bloomington Farmers’ Market."
            caption="The product on the table. The beginning of a story that kept growing."
          />

          <p>
            That growth didn’t happen because somebody wished for it. There are a lot of quiet hours between putting bottles on a folding table and pulling up with a food truck carrying your name across the side. Those are the hours we rarely see: showing up, making the product, serving people, learning, adjusting and coming back again.
          </p>
          <p>
            That is one of the things I appreciate about photographing the Farmers’ Market. If you stay around long enough, the pictures stop being isolated moments. They become a record. You begin to see businesses grow, people return, relationships form and the Square change a little at a time.
          </p>

          <Photo
            src={PHOTO_CUSTOMERS}
            alt="A Hink’s Smokehouse team member talks with customers beside the food truck at the Downtown Bloomington Farmers’ Market."
            caption="People are the middle of the story. Showing up, serving, talking and building relationships."
          />

          <p>
            We spend enough time looking for extraordinary stories somewhere else that we can miss the growth and resilience happening ten feet away from us. The Square isn’t just vegetables, baked goods, barbecue and people walking around on Saturday morning. It is people building things. Families working. Small businesses taking chances. People getting a little better at what they do and coming back the next week to do it again.
          </p>
          <p>
            These photographs tell that story without me having to manufacture one. The products on the table. The conversations with customers. Then that big beautiful truck carrying Hink’s Smokehouse down the road.
          </p>

          <Photo
            src={PHOTO_TRUCK}
            alt="Hink’s Smokehouse food truck at the Downtown Bloomington Farmers’ Market with its large red pig logo and branding visible."
            caption="Product. People. Progress. Sometimes growth is sitting right there in front of the camera."
          />

          <p>Look at them now.</p>
          <p>
            Next time you’re at the Downtown Bloomington Farmers’ Market and smell barbecue working its way around the Square, go find Hink’s Smokehouse. Get yourself something to eat. Grab some sauce. Say hello. Supporting our neighbors doesn’t have to be complicated.
          </p>
          <p>Sometimes you just buy a bottle of barbecue sauce. And then you stick around long enough to see what happens.</p>

          <p className="blog-pull blog-pull--mixed-case !ml-0 !mr-0">
            Fit 2 capture. Fit 2 curate. Fit 2 print.
          </p>
        </div>

        <div className="mt-12 flex flex-wrap gap-2 border-t border-white/10 pt-8">
          {["Behind The Print", "Bloomington", "Farmers’ Market", "Small Business", "Community"].map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-wide text-white/50"
            >
              {tag}
            </span>
          ))}
        </div>
      </article>

      <FinalCta />
    </main>
  );
}
