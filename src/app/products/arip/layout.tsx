import type { Metadata } from "next";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "ARIP — AI Commercial Orchestration for Hotels",
  description: "Explore ARIP, SOYL's pilot-stage platform for coordinating hotel pricing, marketing, distribution, and guest revenue agents within hotel-defined controls.",
  openGraph: {
    title: "ARIP — AI Commercial Orchestration for Hotels | SOYL Cloud",
    description: "Specialist hotel commercial agents, coordinated with shared context, controls, and reviewable decisions.",
    url: `https://${COMPANY.domain}/products/arip`,
  },
  alternates: {
    canonical: `https://${COMPANY.domain}/products/arip`,
  },
};

export default function AripLayout({ children }: { children: React.ReactNode }) {
  return children;
}
