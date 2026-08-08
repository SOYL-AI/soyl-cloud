import type { Metadata } from "next";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Butler AI — Guest Requests, Routed to Staff",
  description: "Turn hotel guest conversations into routed, trackable service tasks. Butler AI works by QR code or web link in 50+ languages — no app download required.",
  openGraph: {
    title: "Butler AI — Guest Requests, Routed to Staff",
    description: "One simple concierge for guests and one clear operations queue for hotel staff.",
    url: `https://${COMPANY.domain}/products/butler-ai`,
  },
  alternates: {
    canonical: `https://${COMPANY.domain}/products/butler-ai`,
  },
};

export default function ButlerAILayout({ children }: { children: React.ReactNode }) {
  return children;
}
