import type { Metadata } from "next";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "ARIP Platform — Autonomous Digital Workforce",
  description: "Synchronized workforce of specialized AI agents that autonomously execute pricing, launch marketing campaigns, and grow RevPAR around the clock.",
  openGraph: {
    title: "ARIP Platform — Autonomous Digital Workforce | SOYL Cloud",
    description: "Synchronized workforce of specialized AI agents that autonomously execute pricing, launch marketing campaigns, and grow RevPAR around the clock.",
    url: `https://${COMPANY.domain}/products/arip`,
  },
  alternates: {
    canonical: `https://${COMPANY.domain}/products/arip`,
  },
};

export default function AripLayout({ children }: { children: React.ReactNode }) {
  return children;
}
