import Link from "next/link";
import Image from "next/image";
import { SITE, IMAGES } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0a0a0a] px-6 py-16 text-white/60">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-4">
        <div>
          <Image src={IMAGES.logo} alt="Fit2Print" width={150} height={36} className="h-8 w-auto" />
          <p className="mt-4 text-sm">
            Bold portrait photography and museum-grade fine art prints, based in {SITE.location}.
          </p>
        </div>
        <div>
          <p className="section-label mb-4">Explore</p>
          <div className="flex flex-col gap-2 text-sm">
            <Link href="/portfolio">Portfolio</Link>
            <Link href="/services">Services &amp; Pricing</Link>
            <Link href="/prints">Print Shop</Link>
            <Link href="/about">About</Link>
            <Link href="/blog">Behind The Print</Link>
          </div>
        </div>
        <div>
          <p className="section-label mb-4">Contact</p>
          <div className="flex flex-col gap-2 text-sm">
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
            <a href={SITE.phoneHref}>{SITE.phone}</a>
            <p>{SITE.serviceArea}</p>
          </div>
        </div>
        <div>
          <p className="section-label mb-4">Follow</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <a href="https://www.instagram.com/phfit2print_jgj" target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
            <a href="https://www.facebook.com/jguestphotos" target="_blank" rel="noopener noreferrer">
              Facebook
            </a>
            <a href="https://www.tiktok.com/@jguest_photo" target="_blank" rel="noopener noreferrer">
              TikTok
            </a>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-7xl border-t border-white/10 pt-6 text-xs">
        &copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.
      </div>
    </footer>
  );
}
