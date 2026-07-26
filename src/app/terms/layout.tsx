import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Read the SOYL Cloud terms of service. Understand the terms governing your use of our platform.",
  openGraph: {
    url: `${SITE_URL}/terms`,
  },
  alternates: {
    canonical: `${SITE_URL}/terms`,
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
