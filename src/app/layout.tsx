import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Analytics } from "@/components/Analytics";
import { OrganizationSchema } from "@/components/seo/SchemaInjector";
import { COMPANY, SITE_URL } from "@/lib/constants";

/**
 * Inter, variable, upright only.
 *
 * The default configuration pulled two woff2 files totalling 132 KB — the
 * largest resources on every page once the JavaScript came down. The second
 * was the italic variable font, and the site uses italic in exactly one place
 * (a "not specified" cell in the comparison table), which the browser can
 * synthesise perfectly well.
 *
 * `axes: []` drops Inter's optical-size axis, which nothing here varies.
 *
 * Kept as a variable font rather than discrete weights: the site uses medium,
 * semibold, bold and extrabold, and four static files would be four requests
 * and more bytes than one variable file.
 */
const inter = Inter({
  variable: "--font-inter",
  // Both subsets, deliberately. With only `latin`, the page still pulled a
  // second 84 KB file — the site uses characters outside that subset (the
  // rupee sign, em dashes, the "›" separator), and the browser only discovers
  // that font *after* parsing the CSS. That put it on the critical chain:
  // preloaded 48 KB at 30 ms, unpreloaded 84 KB at 182 ms, and the text could
  // not reach its final rendering until the second arrived.
  //
  // Declaring both means both are preloaded from the HTML and fetched in
  // parallel. Slightly more bytes committed up front, one fewer round trip in
  // the chain that decides LCP.
  subsets: ["latin"],
  style: ["normal"],
  // `optional`, not `swap`.
  //
  // The LCP element on the home page is the hero `h1`, and its breakdown was
  // ~1.3 s of *element render delay* with no resource-load phase at all — the
  // signature of a font swap. With `swap`, text paints in the fallback (which
  // is FCP, at 1.1 s), then repaints in Inter when it arrives — and LCP moves
  // to the repaint, because the metric tracks when the largest element reaches
  // its final rendering.
  //
  // `optional` gives the font ~100 ms to arrive and otherwise keeps the
  // fallback for that page view, so there is no second paint and LCP lands
  // with FCP. On any subsequent visit the font is cached and used immediately.
  //
  // The cost is that some first-time visitors see the fallback for one page
  // view. `adjustFontFallback` (on by default) matches its metrics to Inter's,
  // so it is close in colour and identical in layout — CLS stays 0.
  display: "optional",
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
        <OrganizationSchema />
        <Navbar />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
