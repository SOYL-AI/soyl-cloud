import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Security & Compliance — SOYL Cloud",
  description: "Learn how SOYL Cloud protects guest data and hotel operations. Enterprise-grade security, GDPR compliance, and end-to-end encryption.",
  openGraph: {
    url: `${SITE_URL}/security`,
  },
  alternates: {
    canonical: `${SITE_URL}/security`,
  },
};

export default function SecurityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
