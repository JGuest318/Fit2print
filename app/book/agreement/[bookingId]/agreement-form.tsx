"use client";

import { useState } from "react";

export function AgreementForm({ bookingId }: { bookingId: string }) {
  const [agree, setAgree] = useState(false);
  const [promoUsePermission, setPromoUsePermission] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!agree) {
      setError("Please check “I agree to the terms above” to continue.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`/api/booking/agreement/accept/${bookingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agree, promoUsePermission }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      window.location.href = result.retainerPayLink;
    } catch {
      setError("Network error. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <label className="flex items-start gap-3 border border-white/10 bg-white/[0.03] p-5 text-sm leading-relaxed text-white/80">
        <input
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0"
        />
        <span>
          <strong className="text-white">I agree to the terms above</strong> (Sections 1–3: the session, price and payment
          schedule, and cancellation terms).
        </span>
      </label>

      <label className="flex items-start gap-3 border border-[var(--accent)]/40 bg-white/[0.03] p-5 text-sm leading-relaxed text-white/80">
        <input
          type="checkbox"
          checked={promoUsePermission}
          onChange={(e) => setPromoUsePermission(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0"
        />
        <span>
          <strong className="text-[var(--accent)]">Optional:</strong> I grant Photography Fit 2 Print permission to use
          images from this session for portfolio, website, and social media promotion (Section 4). This is entirely
          separate from the agreement above and is not required to book.
        </span>
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !agree}
        className="block w-full rounded-full bg-[var(--accent)] px-8 py-4 text-center text-sm font-bold uppercase tracking-widest text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? "Please wait…" : "Agree and continue to pay the reservation retainer"}
      </button>
    </form>
  );
}
