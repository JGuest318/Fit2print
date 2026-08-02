const words = ["PORTRAITS", "•", "FAMILY", "•", "SENIOR", "•", "FINE ART PRINTS", "•", "BLOOMINGTON, IL", "•"];

export function MarqueeStrip() {
  return (
    <div className="overflow-hidden border-y border-white/10 bg-[var(--accent)] py-4 text-black">
      <div className="marquee-track">
        {[...words, ...words].map((w, i) => (
          <span key={i} className="mx-4 font-[var(--font-display)] text-2xl uppercase">
            {w}
          </span>
        ))}
      </div>
    </div>
  );
}
