import { apiFetch } from "@/lib/api-client";
import { clientKey, createRateLimiter } from "@/lib/rate-limit";

/**
 * Redeem an email-verification token.
 *
 * Rate limited despite the token being unguessable: without a limit this is a
 * free way to burn our database connections, and a limit costs a legitimate
 * visitor nothing because they use it once.
 */

export const dynamic = "force-dynamic";

const limiter = createRateLimiter({ limit: 10, windowMs: 15 * 60 * 1000 });

const NO_STORE = { "Cache-Control": "no-store, no-transform" } as const;

export async function POST(request: Request) {
  const rate = limiter.check(clientKey(request.headers));
  if (!rate.allowed) {
    return Response.json({ message: "Too many attempts. Please try again shortly." }, {
      status: 429,
      headers: { ...NO_STORE, "Retry-After": String(rate.retryAfterSeconds) },
    });
  }

  const body = (await request.json().catch(() => null)) as { token?: unknown } | null;
  if (typeof body?.token !== "string") {
    return Response.json({ message: "That link is not valid." }, { status: 400, headers: NO_STORE });
  }

  const result = await apiFetch<void>("/v1/auth/verify-email", {
    method: "POST",
    body: { token: body.token },
  });

  if (result.ok) {
    return new Response(null, { status: 204, headers: NO_STORE });
  }

  return Response.json(
    { message: "That link is invalid or has expired. Ask for a new one." },
    { status: result.status === 400 ? 400 : 502, headers: NO_STORE },
  );
}
