import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | SOYL Cloud",
    default: "SOYL Cloud | AI Concierge for Modern Hotels",
  },
  description: "Resolve guest requests in under 30 seconds. AI-powered concierge, property management, and operations — unified on one platform.",
  openGraph: {
    title: "SOYL Cloud | AI Concierge for Modern Hotels",
    description: "Resolve guest requests in under 30 seconds. AI-powered concierge, property management, and operations — unified on one platform.",
    url: "https://soyl.cloud",
    siteName: "SOYL Cloud",
    locale: "en_US",
    type: "website",
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
