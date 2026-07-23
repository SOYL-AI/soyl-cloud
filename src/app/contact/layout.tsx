import type { Metadata } from "next";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact Us — Get in Touch with SOYL Cloud",
  description: "Have questions about Butler AI, PMS Lite, or SOYL Dine? Reach out to our team in Bengaluru. We'd love to hear from you.",
  openGraph: {
    title: "Contact Us — Get in Touch with SOYL Cloud",
    description: "Have questions? Reach out to our team. We'd love to hear from you.",
    url: `https://${COMPANY.domain}/contact`,
  },
  alternates: {
    canonical: `https://${COMPANY.domain}/contact`,
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
