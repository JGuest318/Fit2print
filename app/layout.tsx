import type { Metadata } from "next";
import { Anton, Work_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SITE, IMAGES } from "@/lib/site";

const display = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const body = Work_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
});

const defaultDescription =
  "Bold, gallery-style portrait photography and museum-grade fine art prints in Bloomington, Illinois. Headshots, portrait, family, senior, and event sessions by Fit 2 Print.";

export const metadata: Metadata = {
  metadataBase: new URL(`https://${SITE.domain}`),
  title: {
    default: `${SITE.name} | Bold Portrait Photography in Bloomington, IL`,
    template: `%s | ${SITE.shortName}`,
  },
  description: defaultDescription,
  keywords: [
    "Bloomington IL photographer",
    "portrait photography Bloomington Illinois",
    "senior photos Bloomington IL",
    "family photographer Central Illinois",
    "fine art prints",
    "professional headshots Bloomington",
  ],
  authors: [{ name: "John Guest" }],
  creator: SITE.name,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: `https://${SITE.domain}`,
    siteName: SITE.name,
    title: `${SITE.name} | Bold Portrait Photography in Bloomington, IL`,
    description: defaultDescription,
    images: [{ url: IMAGES.heroWoman, width: 1200, height: 1600, alt: SITE.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} | Bold Portrait Photography in Bloomington, IL`,
    description: defaultDescription,
    images: [IMAGES.heroWoman],
  },
  icons: {
    icon: IMAGES.logoIcon,
    shortcut: IMAGES.logoIcon,
    apple: IMAGES.logoIconApple,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `https://${SITE.domain}/#business`,
    name: SITE.name,
    image: IMAGES.heroWoman,
    logo: IMAGES.logo,
    url: `https://${SITE.domain}`,
    telephone: SITE.phoneHref.replace("tel:", ""),
    email: SITE.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Bloomington",
      addressRegion: "IL",
      addressCountry: "US",
    },
    areaServed: SITE.serviceArea,
    priceRange: "$$",
    description: defaultDescription,
    sameAs: [],
  };

  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-[#0a0a0a] font-[var(--font-body)] antialiased">
        <div className="grain-overlay" />
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
