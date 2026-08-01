"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Marketing chrome, on marketing routes only.
 *
 * The root layout renders `Navbar` and `Footer` around every route, which is
 * right for the site and wrong for the two segments that bring their own full
 * frame: `/app` has `WorkspaceShell` and `/admin` has `AdminShell`. Both were
 * rendering underneath a fixed marketing navbar with a "Book Demo" button —
 * visible on production `/app` today, and found while checking the M6 screens.
 *
 * **Why a client component rather than a route group.** Two root layouts is
 * the structurally correct answer and it requires moving every existing route
 * into a `(site)` group — a large, risky move on the only lead channel we
 * have. The other option, reading the path from a header in the root layout,
 * would call `headers()` there and make every marketing page dynamic, undoing
 * M5. `usePathname` resolves during the server render too, so this costs no
 * dynamic rendering, produces no flash of the wrong chrome, and touches
 * nothing outside this file and the layout.
 *
 * Auth pages keep the chrome on purpose. Someone on `/login` who decides they
 * are in the wrong place should be able to navigate away, and that is what the
 * nav is for.
 */

const OWN_CHROME = ["/app", "/admin"];

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const internal = OWN_CHROME.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  return internal ? null : <>{children}</>;
}
