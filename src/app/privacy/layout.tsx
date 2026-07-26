import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read the SOYL Cloud privacy policy. Learn how we collect, use, and protect your personal data.",
  openGraph: {
    url: `${SITE_URL}/privacy`,
  },
  alternates: {
    canonical: `${SITE_URL}/privacy`,
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
