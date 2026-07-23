import type { Metadata } from "next";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Company — SOYL AI",
  description: "SOYL AI is a Bengaluru-based hospitality technology company building AI automation for modern hotels and resorts.",
  alternates: {
    canonical: `https://${COMPANY.domain}/company`,
  },
};

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
