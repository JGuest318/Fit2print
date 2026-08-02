const reviews = [
  {
    name: "Sarah M.",
    quote: "The boldest, most striking portraits I've ever had taken. The print on my wall gets compliments every time.",
  },
  {
    name: "Ava T.",
    quote: "Professional, fast, and the gallery-style edits are unlike anything else in the area.",
  },
  {
    name: "David R.",
    quote: "From the session to the framed metal print — the whole experience felt premium.",
  },
];

export function Testimonials() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <p className="section-label mb-4">Client Love</p>
        <h2 className="hero-heading mb-12 text-4xl text-white md:text-5xl">Testimonials</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {reviews.map((r) => (
            <div key={r.name} className="border border-white/10 p-8">
              <p className="text-white/80">&ldquo;{r.quote}&rdquo;</p>
              <p className="mt-6 text-sm uppercase tracking-wider text-[var(--accent)]">{r.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
