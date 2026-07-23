import type { Metadata } from "next";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "SOYL Dine — Digital Restaurant & QR Ordering",
  description: "Digitize your restaurant with QR-based ordering, real-time kitchen workflows, and seamless billing. Modern dining, digitized.",
  openGraph: {
    title: "SOYL Dine — Digital Restaurant & QR Ordering",
    description: "Digitize your restaurant with QR-based ordering and real-time kitchen workflows.",
    url: `https://${COMPANY.domain}/products/soyl-dine`,
  },
  alternates: {
    canonical: `https://${COMPANY.domain}/products/soyl-dine`,
  },
};

export default function SoylDineLayout({ children }: { children: React.ReactNode }) {
  return children;
}
