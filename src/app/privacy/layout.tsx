import type { Metadata } from "next";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read the SOYL Cloud privacy policy. Learn how we collect, use, and protect your personal data.",
  alternates: {
    canonical: `https://${COMPANY.domain}/privacy`,
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
