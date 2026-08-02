"use client";

import { useEffect, useState } from "react";

export interface GalleryItem {
  src: string;
  alt: string;
  label: string;
  tall?: boolean;
}

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const active = activeIndex !== null ? items[activeIndex] : null;

  useEffect(() => {
    if (activeIndex === null) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveIndex(null);
      if (e.key === "ArrowRight") setActiveIndex((i) => (i === null ? null : (i + 1) % items.length));
      if (e.key === "ArrowLeft") setActiveIndex((i) => (i === null ? null : (i - 1 + items.length) % items.length));
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [activeIndex, items.length]);

  return (
    <>
      {/* Full-bleed masonry: natural aspect ratio, never cropped. Generous gutters
          so images breathe instead of feeling stacked/claustrophobic. */}
      <div className="columns-1 gap-4 px-4 sm:columns-2 sm:gap-5 sm:px-5 lg:columns-3 lg:gap-6 lg:px-6 xl:columns-4">
        {items.map((item, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveIndex(i)}
            className="group relative mb-4 block w-full break-inside-avoid overflow-hidden bg-white/5 text-left sm:mb-5 lg:mb-6"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.src}
              alt={item.alt}
              loading="lazy"
              className="block h-auto w-full object-contain transition duration-700 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-transparent to-transparent p-4 opacity-0 transition group-hover:opacity-100">
              <p className="text-sm uppercase tracking-wider text-white">{item.label}</p>
            </div>
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 md:p-10"
          onClick={() => setActiveIndex(null)}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setActiveIndex(null)}
            className="absolute right-5 top-5 text-3xl leading-none text-white/70 transition hover:text-white"
          >
            &times;
          </button>

          <button
            type="button"
            aria-label="Previous image"
            onClick={(e) => {
              e.stopPropagation();
              setActiveIndex((i) => (i === null ? null : (i - 1 + items.length) % items.length));
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 px-3 py-6 text-4xl text-white/60 transition hover:text-white md:left-6"
          >
            &#8249;
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={active.src}
            alt={active.alt}
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            type="button"
            aria-label="Next image"
            onClick={(e) => {
              e.stopPropagation();
              setActiveIndex((i) => (i === null ? null : (i + 1) % items.length));
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-6 text-4xl text-white/60 transition hover:text-white md:right-6"
          >
            &#8250;
          </button>

          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm uppercase tracking-wider text-white/70">
            {active.label}
          </p>
        </div>
      )}
    </>
  );
}
