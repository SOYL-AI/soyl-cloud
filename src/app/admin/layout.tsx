import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SOYL admin",
  // Never indexed, never cached by an intermediary. The metadata robots rule
  // travels with the segment, so a route added under /admin later inherits it
  // rather than depending on someone remembering robots.ts.
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Every admin page is dynamic.
 *
 * Not a performance choice — a correctness one. These read live cross-tenant
 * data behind a per-user authorisation check, and a statically rendered or
 * cached variant would be a copy of one staff member's view served to whoever
 * asked next.
 */
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
