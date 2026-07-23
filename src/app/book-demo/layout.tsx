import type { Metadata } from "next";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Book a Demo — See SOYL Cloud in Action",
  description: "Schedule a free demo of Butler AI, PMS Lite, and SOYL Dine. See how AI-powered hospitality tools can transform your hotel operations.",
  openGraph: {
    title: "Book a Demo — See SOYL Cloud in Action",
    description: "Schedule a free demo and see how AI can transform your hotel operations.",
    url: `https://${COMPANY.domain}/book-demo`,
  },
  alternates: {
    canonical: `https://${COMPANY.domain}/book-demo`,
  },
};

export default function BookDemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
