import type { Metadata } from "next";

import { ImpersonationBanner } from "@/components/admin/ImpersonationBanner";
import { readSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Your workspace",
  // The authenticated area must never be indexed. metadata robots rather than
  // only robots.ts, because a rule in one file is easy to miss when routes are
  // added and this travels with the segment.
  robots: { index: false, follow: false, nocache: true },
};

/**
 * The banner lives here rather than in `WorkspaceShell` on purpose.
 *
 * `UPDATE.md` §11 requires it on the impersonated session, and the layout is
 * the one thing every `/app` route passes through — including any added later
 * that forgets the shell. Putting it in the shell would make the guarantee
 * depend on a component being used.
 *
 * The banner is the only reason this layout reads the session, so it stays
 * cheap: `readSession` is a cookie decode, not a network call.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await readSession();

  return (
    <>
      {session?.impersonating ? (
        <ImpersonationBanner impersonation={session.impersonating} />
      ) : null}
      {children}
    </>
  );
}
