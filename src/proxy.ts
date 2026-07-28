import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * The authentication gate for `/app/*`.
 *
 * `requireSession` already redirects from inside each page, and that works —
 * but once `loading.tsx` exists the response streams, so the redirect arrives
 * as a `NEXT_REDIRECT` instruction inside a `200` rather than as an HTTP
 * status. In a browser it still navigates; what it also does is send an
 * unauthenticated visitor a skeleton of a workspace they cannot see, and give
 * no-JS clients a one-second `<meta refresh>` delay.
 *
 * Proxy runs before anything renders, so an anonymous request gets a real
 * `307` and no workspace HTML at all. It is also one place rather than one per
 * page, which matters more with every route added under `/app`.
 *
 * This checks only that a session token *exists*. Whether it is still valid is
 * the API's job, and it is not a question worth asking on every request from
 * an edge function that would need a database to answer it — a revoked session
 * gets a 401 from the API and the page redirects then.
 */
export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (token?.sessionToken) {
    return NextResponse.next();
  }

  const login = new URL("/login", request.url);
  // Carry where they were going, so signing in returns them there rather than
  // to a generic landing page — a login detour rather than a login wall.
  login.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);

  return NextResponse.redirect(login);
}

export const config = {
  // Only the authenticated area. The marketing site and the auth pages
  // themselves must stay reachable, and running this on every request would
  // put a JWT decode in front of the home page for no reason.
  matcher: ["/app/:path*", "/onboarding"],
};
