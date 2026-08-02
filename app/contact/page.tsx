import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact | Book Your Session",
  description:
    "Get in touch to book a portrait session or order prints with Photography Fit 2 Print in Bloomington, Illinois.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact | Book Your Session",
    description:
      "Get in touch to book a portrait session or order prints with Photography Fit 2 Print in Bloomington, Illinois.",
    url: "/contact",
  },
};

export default function Contact() {
  return (
    <main className="px-6 pb-24 pt-36">
      <div className="mx-auto grid max-w-6xl gap-16 md:grid-cols-2">
        <div>
          <p className="section-label mb-4">Let's Talk</p>
          <h1 className="hero-heading mb-6 text-5xl text-white md:text-6xl">Contact</h1>
          <p className="mb-8 max-w-md text-white/60">
            Ready to book a session or order a print? Send a message and I'll get back
            to you within 24 hours.
          </p>
          <div className="space-y-3 text-white/70">
            <p>{SITE.email}</p>
            <p>{SITE.phone}</p>
            <p>{SITE.serviceArea}</p>
          </div>
        </div>
        <ContactForm />
      </div>
    </main>
  );
}
