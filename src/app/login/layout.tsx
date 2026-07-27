import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  // Never indexed. An auth surface has no place in a search result.
  robots: { index: false, follow: false, nocache: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
