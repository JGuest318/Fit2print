const stats = [
  { value: "500+", label: "Sessions Shot" },
  { value: "10+", label: "Years Experience" },
  { value: "48hr", label: "Gallery Turnaround" },
  { value: "100%", label: "Museum-Grade Prints" },
];

export function StatsStrip() {
  return (
    <section className="border-y border-white/10 px-6 py-16">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 text-center md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="font-[var(--font-display)] text-4xl text-[var(--accent)] md:text-5xl">
              {s.value}
            </p>
            <p className="mt-2 text-xs uppercase tracking-widest text-white/60">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
