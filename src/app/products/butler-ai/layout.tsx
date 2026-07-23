import type { Metadata } from "next";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Butler AI — AI Concierge for Hotels",
  description: "Resolve guest requests in under 30 seconds. Butler AI handles room service, housekeeping, and guest communication in 50+ languages — no app download needed.",
  openGraph: {
    title: "Butler AI — AI Concierge for Hotels",
    description: "Resolve guest requests in under 30 seconds with Butler AI. No app download. Works from day one.",
    url: `https://${COMPANY.domain}/products/butler-ai`,
  },
  alternates: {
    canonical: `https://${COMPANY.domain}/products/butler-ai`,
  },
};

export default function ButlerAILayout({ children }: { children: React.ReactNode }) {
  return children;
}
