import type { Metadata } from "next";
import { GalleryGrid, GalleryItem } from "@/components/gallery-grid";
import { FinalCta } from "@/components/final-cta";
import { IMAGES } from "@/lib/site";

export const metadata: Metadata = {
  title: "Portfolio | Portrait, Family & Senior Photography",
  description:
    "Browse real client portrait, couples, senior, editorial, and fine-art studio sessions by Photography Fit 2 Print in Bloomington, Illinois.",
  alternates: { canonical: "/portfolio" },
  openGraph: {
    title: "Portfolio | Portrait, Family & Senior Photography",
    description:
      "Browse real client portrait, couples, senior, editorial, and fine-art studio sessions by Photography Fit 2 Print in Bloomington, Illinois.",
    url: "/portfolio",
  },
};

const items: GalleryItem[] = [
  { src: IMAGES.heroWoman, alt: "Portrait session", label: "Portrait Session", tall: true },
  { src: IMAGES.manLeather, alt: "Editorial studio portrait", label: "Editorial Portrait" },
  { src: IMAGES.couple, alt: "Family session behind the scenes", label: "Family Session BTS" },
  { src: IMAGES.businesswoman, alt: "Portrait session", label: "Portrait Session" },
  { src: IMAGES.senior, alt: "Senior session", label: "Senior Session" },
  { src: IMAGES.family, alt: "Black and white portrait", label: "Fine Art Portrait", tall: true },
  { src: IMAGES.studio, alt: "Editorial fashion portrait", label: "Editorial Fashion" },
  { src: IMAGES.elderly, alt: "Beauty portrait", label: "Beauty Portrait" },
  { src: IMAGES.creative, alt: "Creative studio portrait", label: "Creative Studio" },
  { src: IMAGES.motorcycleStudio, alt: "Motorcycle studio portrait", label: "Motorcycle Studio", tall: true },
  { src: IMAGES.seniorContainer, alt: "Senior session", label: "Senior Session" },
  { src: IMAGES.editorialFloral, alt: "Model editorial portrait", label: "Model Editorial" },
  { src: IMAGES.seniorLace, alt: "Senior portrait", label: "Senior Portrait" },
  { src: IMAGES.boudoir, alt: "Boudoir portrait", label: "Boudoir" },
  { src: IMAGES.seniorMall, alt: "Senior session", label: "Senior Session", tall: true },
  { src: IMAGES.environmentalPortrait, alt: "Environmental portrait", label: "Environmental Portrait" },
  { src: IMAGES.editorialCreative, alt: "Creative editorial portrait", label: "Editorial Portrait" },
  { src: IMAGES.motorcycleStudio2, alt: "Motorcycle studio portrait", label: "Motorcycle Studio" },
  { src: IMAGES.communityEvent, alt: "Community event photography", label: "Event", tall: true },
  { src: IMAGES.fashionPortraitBlue, alt: "Fashion portrait in blue gown", label: "Fashion Portrait" },
  { src: IMAGES.avantGardeJeweled, alt: "Avant garde jeweled portrait", label: "Avant Garde" },
  { src: IMAGES.avantGardeGreen, alt: "Avant garde green feather portrait", label: "Avant Garde" },
  { src: IMAGES.fashionPink, alt: "Fashion editorial portrait", label: "Fashion" },
  { src: IMAGES.maternityGreen, alt: "Maternity portrait in green gown", label: "Maternity", tall: true },
  { src: IMAGES.boudoirScarf, alt: "Boudoir portrait with scarf", label: "Boudoir" },
  { src: IMAGES.fashionLaceCrouch, alt: "Fashion portrait in black lace", label: "Fashion Portrait" },
  { src: IMAGES.editorialNeonGlasses, alt: "Editorial portrait with neon lighting", label: "Editorial Portrait" },
  { src: IMAGES.beautyWingsCloseup, alt: "Beauty portrait close-up", label: "Beauty Portrait" },
  { src: IMAGES.editorialNotebook, alt: "Editorial portrait with notebook", label: "Editorial Portrait" },
  { src: IMAGES.boudoirDoorway, alt: "Boudoir portrait in doorway", label: "Boudoir" },
  { src: IMAGES.portraitHeadwrapSmile, alt: "Portrait session with headwrap", label: "Portrait Session" },
  { src: IMAGES.portraitHeadwrapFloral, alt: "Portrait session with headwrap", label: "Portrait Session" },
  { src: IMAGES.avantGardeFurHarness, alt: "Avant garde portrait with fur and leather", label: "Avant Garde" },
  { src: IMAGES.fashionTulleGown, alt: "Fashion portrait in blue tulle gown", label: "Fashion Portrait" },
  { src: IMAGES.behindTheScenesCamera, alt: "Photographer behind the scenes", label: "Behind the Scenes" },
  { src: IMAGES.boudoirKneeling, alt: "Boudoir portrait", label: "Boudoir" },
  { src: IMAGES.eventFriendsFlowers, alt: "Group of friends at an event", label: "Event" },
  { src: IMAGES.environmentalProfile, alt: "Environmental portrait outdoors", label: "Environmental Portrait" },
  { src: IMAGES.eventMarketVendor, alt: "Local market vendor portrait", label: "Event" },
  { src: IMAGES.environmentalScooter, alt: "Environmental portrait outdoors", label: "Environmental Portrait" },
  { src: IMAGES.portraitYellowTop1, alt: "Portrait session outdoors", label: "Portrait Session" },
  { src: IMAGES.portraitYellowTop2, alt: "Portrait session outdoors", label: "Portrait Session" },
  { src: IMAGES.familyParkMotherSon, alt: "Family session in the park", label: "Family Session" },
  { src: IMAGES.familyParkMotherSon2, alt: "Family session in the park", label: "Family Session" },
  { src: IMAGES.avantGardeSnakeApple, alt: "Avant-garde editorial with snake and apple", label: "Avant Garde" },
  { src: IMAGES.seniorFallLeaves, alt: "Senior portrait among autumn leaves", label: "Senior Portrait" },
  { src: IMAGES.editorialGreenVelvetHat, alt: "Editorial portrait in green velvet and wide-brim hat", label: "Editorial" },
  { src: IMAGES.seniorRedHairStudio1, alt: "Senior studio portrait with red hair", label: "Senior Portrait" },
  { src: IMAGES.seniorRedHairStudio2, alt: "Senior studio portrait close-up with red hair", label: "Senior Portrait" },
];

export default function Portfolio() {
  return (
    <main className="pb-24 pt-36">
      <div className="mx-auto max-w-7xl px-6">
        <p className="section-label mb-4">Selected Work</p>
        <h1 className="hero-heading mb-4 text-5xl text-white md:text-7xl">Portfolio</h1>
        <p className="mb-12 max-w-xl text-white/60">
          A mix of portrait, couples, senior, editorial, and studio work from real client sessions.
        </p>
      </div>
      <div className="w-full">
        <GalleryGrid items={items} />
      </div>
      <FinalCta />
    </main>
  );
}
