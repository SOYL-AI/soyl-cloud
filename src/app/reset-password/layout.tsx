import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Choose a new password",
  // Never indexed. The URL carries a single-use reset token in its query string.
  robots: { index: false, follow: false, nocache: true },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
