import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Company — SOYL AI",
  description: "SOYL AI is a Bengaluru-based hospitality technology company building AI automation for modern hotels and resorts.",
  openGraph: {
    url: `${SITE_URL}/company`,
  },
  alternates: {
    canonical: `${SITE_URL}/company`,
  },
};

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
