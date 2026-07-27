import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your workspace",
  // The authenticated area must never be indexed. metadata robots rather than
  // only robots.ts, because a rule in one file is easy to miss when routes are
  // added and this travels with the segment.
  robots: { index: false, follow: false, nocache: true },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
