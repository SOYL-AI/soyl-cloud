/**
 * Reading the session on the server.
 *
 * `getToken` rather than `getServerSession`: the API session token lives in
 * the JWT and is deliberately *not* copied onto the Session object, because
 * `useSession` serialises that to the browser. Server code that needs to call
 * the API reads the raw token here.
 */

import { getToken } from "next-auth/jwt";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Set while staff are viewing a customer's workspace as that customer.
 *
 * Its presence is what draws the banner. `UPDATE.md` §11 requires one, and the
 * reason it is required is that the failure mode without it is not confusion —
 * it is someone believing they are looking at their own data.
 */
export type Impersonation = {
  tenantName: string;
  actingAs: string;
  expiresAt: string;
};

export type ServerSession = {
  userId: string;
  /** NextAuth puts this on the JWT from the authorize() result. */
  email: string | null;
  sessionToken: string;
  activeTenantId: string | null;
  isEmailVerified: boolean;
  /** Null in the ordinary case. */
  impersonating: Impersonation | null;
};

/** Holds the impersonated API token and what to put in the banner. */
export const IMPERSONATION_COOKIE = "soyl.impersonation";

/**
 * The current session, or null.
 *
 * `getToken` normally takes a `NextRequest`; in a server component there isn't
 * one, so the cookie and header stores are adapted into the minimal shape it
 * reads.
 *
 * **Impersonation replaces `sessionToken` by default.** That is deliberate:
 * every `/app` page and every route handler under `/api` already reads this
 * one function, so the workspace shows the customer's data with no change to
 * any of them — and, more importantly, no route can be *forgotten* and quietly
 * keep showing the staff member's own tenant.
 *
 * `/admin` passes `ignoreImpersonation` so the panel keeps working while an
 * impersonation is live. It is belt and braces: the API refuses an
 * impersonated session on `/v1/admin` regardless, so getting this flag wrong
 * fails closed.
 */
export async function readSession(
  options: { ignoreImpersonation?: boolean } = {},
): Promise<ServerSession | null> {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const token = await getToken({
    req: {
      headers: Object.fromEntries(headerStore.entries()),
      cookies: Object.fromEntries(
        cookieStore.getAll().map((cookie) => [cookie.name, cookie.value]),
      ),
    } as never,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.sessionToken || !token.userId) return null;

  const base: ServerSession = {
    userId: token.userId,
    email: typeof token.email === "string" ? token.email : null,
    sessionToken: token.sessionToken,
    activeTenantId: token.activeTenantId ?? null,
    isEmailVerified: token.isEmailVerified ?? false,
    impersonating: null,
  };

  if (options.ignoreImpersonation) return base;

  const active = readImpersonationCookie(cookieStore.get(IMPERSONATION_COOKIE)?.value);
  if (!active) return base;

  return {
    ...base,
    sessionToken: active.token,
    impersonating: {
      tenantName: active.tenantName,
      actingAs: active.actingAs,
      expiresAt: active.expiresAt,
    },
  };
}

type ImpersonationCookie = Impersonation & { token: string };

/**
 * Parse the cookie, treating anything unexpected as "not impersonating".
 *
 * The client-side expiry check is a courtesy, not the control: the session row
 * carries its own 30-minute expiry and the API stops honouring the token then
 * whatever this file believes. Checking here only means the banner disappears
 * at the same moment the access does, rather than a page load later.
 */
function readImpersonationCookie(raw: string | undefined): ImpersonationCookie | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<ImpersonationCookie>;
    if (
      typeof parsed.token !== "string" ||
      typeof parsed.tenantName !== "string" ||
      typeof parsed.actingAs !== "string" ||
      typeof parsed.expiresAt !== "string"
    ) {
      return null;
    }
    if (Date.parse(parsed.expiresAt) <= Date.now()) return null;
    return parsed as ImpersonationCookie;
  } catch {
    return null;
  }
}

/**
 * The session, or a redirect to sign in.
 *
 * `next` carries where they were going, so signing in returns them there
 * rather than to a generic landing page — the difference between a login wall
 * and a login detour.
 */
export async function requireSession(returnTo: string): Promise<ServerSession> {
  const session = await readSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  }
  return session;
}
