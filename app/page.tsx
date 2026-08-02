import { HomeHero } from "@/components/home-hero";
import { MarqueeStrip } from "@/components/marquee-strip";
import { StatsStrip } from "@/components/stats-strip";
import { ServicesPreview } from "@/components/services-preview";
import { PrintCta } from "@/components/print-cta";
import { Testimonials } from "@/components/testimonials";
import { FinalCta } from "@/components/final-cta";

export default function Home() {
  return (
    <main>
      <HomeHero />
      <MarqueeStrip />
      <StatsStrip />
      <ServicesPreview />
      <PrintCta />
      <Testimonials />
      <FinalCta />
    </main>
  );
}
