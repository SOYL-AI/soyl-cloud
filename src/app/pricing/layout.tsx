import type { Metadata } from "next";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Pricing — Simple, Transparent Plans",
  description: "Explore SOYL Cloud pricing plans. Affordable AI concierge and property management for boutique hotels, resorts, and restaurants.",
  openGraph: {
    title: "Pricing — Simple, Transparent Plans",
    description: "Affordable AI concierge and property management for hospitality businesses.",
    url: `https://${COMPANY.domain}/pricing`,
  },
  alternates: {
    canonical: `https://${COMPANY.domain}/pricing`,
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
