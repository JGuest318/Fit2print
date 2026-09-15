"use client";

import { FormEvent, useState } from "react";

type State = "idle" | "submitting" | "success" | "error";

export function BespokeBookingForm() {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setError("");

    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch("/api/booking/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(15000),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || result?.success !== true) {
        setError(typeof result?.error === "string" ? result.error : "We could not confirm your request was saved. Please try again.");
        setState("error");
        return;
      }

      setState("success");
      form.reset();
    } catch {
      setError("We could not confirm your request was saved. Please check your connection and try again.");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="mt-8 border border-[var(--accent)]/50 p-6" role="status">
        <p className="font-[var(--font-display)] text-2xl uppercase text-white">Request received.</p>
        <p className="mt-3 text-sm leading-relaxed text-white/60">
          This is not yet a confirmed booking and no payment has been taken. PF2P will confirm availability before a reservation retainer is requested.
        </p>
      </div>
    );
  }

  return (
    <form className="mt-8 space-y-6" onSubmit={submit}>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Your name" name="name" autoComplete="name" required />
        <Field label="Email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Phone" name="phone" type="tel" autoComplete="tel" required />
        <Field label="Preferred session date" name="requestedDate" type="date" required />
      </div>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-widest text-white/65">What are you hoping to create?</span>
        <textarea
          name="sessionIntent"
          rows={4}
          required
          maxLength={1000}
          className="mt-2 w-full border border-white/15 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[var(--accent)]"
          placeholder="A little context is enough. We can talk through the rest together."
        />
      </label>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-widest text-white/65">Anything we should know to make the experience comfortable?</span>
        <textarea
          name="comfortNotes"
          rows={3}
          maxLength={1000}
          className="mt-2 w-full border border-white/15 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[var(--accent)]"
          placeholder="Optional. Share only what would help us serve you well."
        />
      </label>

      <label className="flex items-start gap-3 border border-white/10 p-4 text-sm leading-relaxed text-white/60">
        <input name="acknowledgement" value="accepted" type="checkbox" required className="mt-1" />
        <span>
          I understand the Bespoke Experience is $995, with a $300 reservation retainer required to confirm an available session and the remaining $695 due on the session date. Submitting this form alone does not reserve a date or charge me.
        </span>
      </label>

      {state === "error" && <p className="text-sm text-red-300" role="alert">{error}</p>}

      <button
        type="submit"
        disabled={state === "submitting"}
        className="w-full rounded-full bg-[var(--accent)] px-8 py-4 text-sm font-bold uppercase tracking-widest text-black transition hover:bg-white disabled:cursor-wait disabled:opacity-60"
      >
        {state === "submitting" ? "Sending Request…" : "Request a Bespoke Session"}
      </button>
      <p className="text-center text-xs leading-relaxed text-white/35">
        No card information is collected on this page. Payment will only be introduced after the secure payment workflow and PF2P policies are approved for production.
      </p>
    </form>
  );
}

function Field({ label, name, type = "text", ...props }: { label: string; name: string; type?: string; [key: string]: unknown }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-widest text-white/65">{label}</span>
      <input
        name={name}
        type={type}
        className="mt-2 w-full border border-white/15 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[var(--accent)]"
        {...props}
      />
    </label>
  );
}
