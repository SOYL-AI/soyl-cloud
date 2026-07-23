import type { Metadata } from "next";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Read the SOYL Cloud terms of service. Understand the terms governing your use of our platform.",
  alternates: {
    canonical: `https://${COMPANY.domain}/terms`,
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
