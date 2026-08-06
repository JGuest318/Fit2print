"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { SITE, IMAGES } from "@/lib/site";

const links = [
  { href: "/portfolio", label: "Portfolio" },
  { href: "/services", label: "Services" },
  { href: "/prints", label: "Print Shop" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Behind The Print" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed top-0 z-40 w-full border-b border-white/10 bg-[#0a0a0a]/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center">
          <Image src={IMAGES.logo} alt="Fit2Print" width={150} height={36} priority className="h-8 w-auto" />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm uppercase tracking-wider text-white/70 transition hover:text-[var(--accent)]"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-4 md:flex">
          <a href={SITE.phoneHref} className="text-sm text-white/70">
            {SITE.phone}
          </a>
          <Link
            href="/contact"
            className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold uppercase tracking-wide text-black transition hover:bg-white"
          >
            Book a Session
          </Link>
        </div>
        <button className="md:hidden text-white" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="flex flex-col gap-4 border-t border-white/10 px-6 py-6 md:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-lg uppercase tracking-wider text-white/80"
            >
              {l.label}
            </Link>
          ))}
          <a href={SITE.phoneHref} className="text-white/60">
            {SITE.phone}
          </a>
        </div>
      )}
    </header>
  );
}
