import type { Metadata } from "next";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "PMS Lite — Hotel Property Management System",
  description: "Manage bookings, rooms, billing, and staff operations from a single, clean dashboard designed for speed. Built for boutique hotels and independent properties.",
  openGraph: {
    title: "PMS Lite — Hotel Property Management System",
    description: "Manage bookings, rooms, billing, and staff operations from one dashboard.",
    url: `https://${COMPANY.domain}/products/pms-lite`,
  },
  alternates: {
    canonical: `https://${COMPANY.domain}/products/pms-lite`,
  },
};

export default function PMSLiteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
