import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { COMPANY, SITE_URL } from "@/lib/constants";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: "%s | SOYL Cloud",
    default: "SOYL Cloud | AI Concierge for Modern Hotels",
  },
  description: "Resolve guest requests in under 30 seconds. AI-powered concierge, property management, and operations — unified on one platform.",
  openGraph: {
    title: "SOYL Cloud | AI Concierge for Modern Hotels",
    description: "Resolve guest requests in under 30 seconds. AI-powered concierge, property management, and operations — unified on one platform.",
    url: SITE_URL,
    siteName: "SOYL Cloud",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "SOYL Cloud — AI Concierge for Modern Hotels",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SOYL Cloud | AI Concierge for Modern Hotels",
    description: "Resolve guest requests in under 30 seconds. AI-powered concierge, property management, and operations — unified on one platform.",
    images: ["/images/og-image.png"],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased scroll-smooth`}>
      <body className="min-h-full flex flex-col selection:bg-[var(--color-soyl-mint)] selection:text-white bg-white text-[var(--color-soyl-charcoal)]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "SOYL AI",
                alternateName: "SOYL Cloud",
                url: SITE_URL,
                logo: `${SITE_URL}/images/logo.png`,
                description: "SOYL AI is a hospitality technology company building AI concierges, property management systems, and operational automation for hotels, resorts, and restaurants.",
                foundingDate: "2024",
                knowsAbout: [
                  "Artificial Intelligence",
                  "Hospitality Technology",
                  "Hotel Management Software",
                  "Conversational AI",
                  "Digital Concierge",
                ],
                contactPoint: {
                  "@type": "ContactPoint",
                  telephone: COMPANY.phone,
                  email: COMPANY.email,
                  contactType: "sales",
                },
                address: {
                  "@type": "PostalAddress",
                  addressLocality: "Bengaluru",
                  addressRegion: "Karnataka",
                  postalCode: "560043",
                  addressCountry: "IN",
                },
                sameAs: ["https://www.linkedin.com/company/soyl-ai/"],
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "SOYL Cloud",
                url: SITE_URL,
                potentialAction: {
                  "@type": "SearchAction",
                  target: `${SITE_URL}/blog?q={search_term_string}`,
                  "query-input": "required name=search_term_string",
                },
              },
            ]),
          }}
        />
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-black">
          Skip to content
        </a>
        <Navbar />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
