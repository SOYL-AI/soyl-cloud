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

export type ServerSession = {
  userId: string;
  /** NextAuth puts this on the JWT from the authorize() result. */
  email: string | null;
  sessionToken: string;
  activeTenantId: string | null;
  isEmailVerified: boolean;
};

/**
 * The current session, or null.
 *
 * `getToken` normally takes a `NextRequest`; in a server component there isn't
 * one, so the cookie and header stores are adapted into the minimal shape it
 * reads.
 */
export async function readSession(): Promise<ServerSession | null> {
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

  return {
    userId: token.userId,
    email: typeof token.email === "string" ? token.email : null,
    sessionToken: token.sessionToken,
    activeTenantId: token.activeTenantId ?? null,
    isEmailVerified: token.isEmailVerified ?? false,
  };
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
