import type { Metadata } from "next";
import Image from "next/image";
import { Printer, Heart, Award, MapPin } from "lucide-react";
import { FinalCta } from "@/components/final-cta";
import { IMAGES, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About | What's in a Name? — The Story Behind Fit 2 Print",
  description:
    "A photograph has two lives — the moment it's made, and every time it's held, shared, and remembered. The personal story behind Photography Fit 2 Print, founded by John Guest in Bloomington, Illinois.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About | What's in a Name? — The Story Behind Fit 2 Print",
    description:
      "A photograph has two lives — the moment it's made, and every time it's held, shared, and remembered. The personal story behind Photography Fit 2 Print.",
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
      <div className="mx-auto max-w-3xl">
        <p className="section-label mb-4 text-center">Our Story</p>
        <h1 className="hero-heading mb-8 text-center text-4xl text-white md:text-6xl">
          What&rsquo;s In A Name?
        </h1>

        <div className="mb-10 flex flex-col items-center gap-4 text-center">
          <div className="relative h-20 w-20 overflow-hidden rounded-full ring-1 ring-white/15">
            <Image src={IMAGES.ownerPortrait} alt="John Guest, founder of Photography Fit 2 Print" fill className="object-cover object-top" />
          </div>
          <p className="text-lg italic text-white/80">
            Hi, my name is John, and I&rsquo;d like to share a story.
          </p>
        </div>

        <div className="space-y-6 text-base leading-relaxed text-white/70 md:text-lg">
          <p>
            Every Black family I ever visited seemed to have the same thing waiting in the living
            room: a stack of photo albums resting on the coffee table. You know the scene. The
            television is on with the volume turned down, a ball game flickering across the
            screen. Luther Vandross is playing somewhere in the house, and the aroma of dinner
            drifts in from the kitchen. There are no cell phones demanding everyone&rsquo;s
            attention&mdash;just albums, their pages swollen at the seams, quietly waiting to be
            opened.
          </p>
          <p>No one had to tell you to pick one up. You just did.</p>
          <p>
            One page became ten. Vacation photos became wedding photos. Baby pictures became
            graduations. Before long, you were laughing with people you&rsquo;d only just met
            because, for a little while, you had been invited into their family&rsquo;s story.
          </p>
          <p>
            Long before social media curated our lives into digital feeds, those photo albums
            were ours. They weren&rsquo;t just collections of pictures; they were conversations.
            Every photograph had a story. Every story connected one generation to the next.
            Looking back, I realize those afternoons shaped the way I would one day see
            photography.
          </p>
          <p>
            Back then, printing wasn&rsquo;t optional. Film had to be developed. Photographs had
            to be printed if they were ever going to be seen again. But I&rsquo;ve come to realize
            that printing wasn&rsquo;t simply a necessity of the technology&mdash;it was the
            experience. A photograph didn&rsquo;t become part of the family when the shutter
            clicked. It became part of the family when someone held it, shared it, revisited it,
            and remembered it.
          </p>
          <p>Years later, my mother reminded me of that truth without even realizing it.</p>
          <p>
            I wanted to surprise her with a digital picture frame. It seemed like the perfect
            gift&mdash;hundreds of photographs in one elegant display. I meant well. She lived in
            New York, and I lived in Alexandria, VA, so streaming pictures of her grandchild to her
            felt like the next best thing to being there&mdash;the highlights, at least. She just
            smiled, but then she said something that stopped me in my tracks.
            She talked about how different it felt to hold a photograph in her hands. She missed
            the weight of it, the texture, the simple act of turning it over or passing it to
            someone else. A digital image could be seen, but a printed photograph could be felt
            and experienced.
          </p>
          <p>
            In that moment, I realized I had begun treating photographs as files when I had grown
            up experiencing them as family heirlooms.
          </p>
          <p>That realization became the foundation of Photography Fit 2 Print.</p>
          <p>
            We use names to identify ourselves&mdash;our dreams, our passions, our purpose. A name
            is never just a label. It&rsquo;s a claim. It&rsquo;s the reputation we put forward
            when everything else is stripped away.
          </p>
          <p>
            Photography Fit 2 Print isn&rsquo;t a name I chose because it sounded clever. It&rsquo;s
            a declaration. You see it&rsquo;s a play on the New York Times motto, &ldquo;All the
            News That&rsquo;s Fit to Print&rdquo; is the famous motto of The New York Times,
            created by owner Adolph Ochs in 1896, standing for honesty, fairness, and truth in
            reporting. That rich history stuck with me. My Dad was an avid reader and the Times
            was his favorite.
          </p>
          <p>
            Not every photograph deserves to become a print. A photograph earns that privilege
            through vision, craftsmanship, intention, and care. It deserves to live somewhere
            beyond a hard drive or a cloud account. It deserves a place on a wall, on a mantle, or
            within the pages of an heirloom photo book where it can continue telling its story for
            generations.
          </p>
          <p>
            That&rsquo;s why every photograph we create&mdash;and every print we produce&mdash;is
            approached with intention. From thoughtful image selection to archival papers,
            meticulous color management, and careful craftsmanship, every decision serves a single
            purpose: creating something worthy of becoming part of your family&rsquo;s story.
          </p>
        </div>

        <div className="my-14 border-t border-white/10 pt-14 text-center">
          <p className="hero-heading text-2xl text-[var(--accent)] md:text-4xl">
            Because A Photograph Has Two Lives.
          </p>
          <p className="mt-6 text-lg text-white/80">The first is the moment it&rsquo;s made.</p>
          <p className="mt-2 text-lg text-white/80">
            The second is every time it&rsquo;s held, shared, revisited, and remembered.
          </p>
          <p className="mt-8 text-base text-white/60">
            At Photography Fit 2 Print, we exist to make sure that second life endures.
          </p>
        </div>
      </div>

      <div className="mx-auto mt-20 grid max-w-6xl gap-8 border-t border-white/10 pt-16 md:grid-cols-4">
        {values.map((v) => (
          <div key={v.title}>
            <v.icon className="mb-4 h-8 w-8 text-[var(--accent)]" />
            <h3 className="font-[var(--font-display)] text-lg uppercase text-white">{v.title}</h3>
            <p className="mt-2 text-sm text-white/60">{v.desc}</p>
          </div>
        ))}
      </div>

      <FinalCta />
    </main>
  );
}
