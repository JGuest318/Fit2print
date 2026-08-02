"use client";

import { useState } from "react";
import { SITE } from "@/lib/site";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [form, setForm] = useState({ name: "", email: "", phone: "", sessionType: "", message: "" });

  function buildMailtoFallback() {
    const subject = encodeURIComponent(`New inquiry from ${form.name || "website visitor"} — ${SITE.shortName} website`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone || "Not provided"}\nSession type: ${
        form.sessionType || "Not specified"
      }\n\nMessage:\n${form.message}`
    );
    return `mailto:${SITE.email}?subject=${subject}&body=${body}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`https://formsubmit.co/ajax/${SITE.email}`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          Name: form.name,
          Email: form.email,
          Phone: form.phone || "Not provided",
          "Session Type": form.sessionType || "Not specified",
          Message: form.message,
          _subject: `New inquiry from ${form.name} — ${SITE.shortName} website`,
          _template: "table",
          _captcha: "false",
        }),
      });
      clearTimeout(timeout);
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.success === "false" || data?.success === false) {
        throw new Error("delivery failed");
      }
      setStatus("success");
      setForm({ name: "", email: "", phone: "", sessionType: "", message: "" });
    } catch {
      // Delivery to the relay failed (network error, timeout, or the relay rejected it).
      // Never let an inquiry silently vanish — open the visitor's email client with
      // everything pre-filled so the message still reaches johng@phfit2print.com.
      setStatus("error");
      window.location.href = buildMailtoFallback();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        required
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="border border-white/20 bg-transparent px-4 py-3 text-white placeholder-white/40 focus:border-[var(--accent)] focus:outline-none"
      />
      <input
        required
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="border border-white/20 bg-transparent px-4 py-3 text-white placeholder-white/40 focus:border-[var(--accent)] focus:outline-none"
      />
      <input
        placeholder="Phone"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        className="border border-white/20 bg-transparent px-4 py-3 text-white placeholder-white/40 focus:border-[var(--accent)] focus:outline-none"
      />
      <input
        placeholder="Session type (e.g. Portrait, Family, Senior)"
        value={form.sessionType}
        onChange={(e) => setForm({ ...form, sessionType: e.target.value })}
        className="border border-white/20 bg-transparent px-4 py-3 text-white placeholder-white/40 focus:border-[var(--accent)] focus:outline-none"
      />
      <textarea
        required
        placeholder="Tell me about your vision..."
        rows={5}
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        className="border border-white/20 bg-transparent px-4 py-3 text-white placeholder-white/40 focus:border-[var(--accent)] focus:outline-none"
      />
      <button
        disabled={status === "loading"}
        className="rounded-full bg-[var(--accent)] px-8 py-4 text-sm font-semibold uppercase tracking-wide text-black transition hover:bg-white disabled:opacity-50"
      >
        {status === "loading" ? "Sending..." : "Send Inquiry"}
      </button>
      {status === "success" && <p className="text-sm text-[var(--accent)]">Thanks! I'll be in touch soon.</p>}
      {status === "error" && (
        <p className="text-sm text-red-400">
          We couldn&apos;t confirm delivery, so we opened your email app with your message pre-filled —
          please hit send there. You can also reach me directly at{" "}
          <a href={`mailto:${SITE.email}`} className="underline">
            {SITE.email}
          </a>
          .
        </p>
      )}
      <p className="text-xs text-white/40">
        Prefer email? Reach me directly at{" "}
        <a href={`mailto:${SITE.email}`} className="underline hover:text-white">
          {SITE.email}
        </a>
        .
      </p>
    </form>
  );
}
