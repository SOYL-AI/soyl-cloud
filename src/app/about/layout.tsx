import type { Metadata } from "next";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About Us — The Team Behind SOYL Cloud",
  description: "Meet the team building the future of hospitality technology. SOYL Cloud is a Bengaluru-based startup on a mission to automate hotel operations with AI.",
  openGraph: {
    title: "About Us — The Team Behind SOYL Cloud",
    description: "Meet the team building the future of hospitality technology.",
    url: `https://${COMPANY.domain}/about`,
  },
  alternates: {
    canonical: `https://${COMPANY.domain}/about`,
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
