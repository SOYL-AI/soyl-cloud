import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Confirming your email",
  // Never indexed. The URL carries a single-use verification token in its query string.
  robots: { index: false, follow: false, nocache: true },
};

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
