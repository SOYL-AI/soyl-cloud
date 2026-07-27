import { apiFetch } from "@/lib/api-client";
import { clientKey, createRateLimiter } from "@/lib/rate-limit";

/**
 * Request a reset link, and confirm one.
 *
 * Both verbs on one route because they are the two halves of one flow.
 *
 * The request half answers 202 for every address, registered or not — the API
 * does the same, and this layer must not be the one that reintroduces an
 * account-existence oracle by, say, returning 404 when the API returns 202.
 */

export const dynamic = "force-dynamic";

// Tighter than signup. Someone enumerating addresses here is cheap to serve
// and expensive to us in Resend quota.
const requestLimiter = createRateLimiter({ limit: 4, windowMs: 15 * 60 * 1000 });
const confirmLimiter = createRateLimiter({ limit: 10, windowMs: 15 * 60 * 1000 });

const NO_STORE = { "Cache-Control": "no-store, no-transform" } as const;

function json(body: unknown, status: number, headers: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { ...NO_STORE, ...headers } });
}

/** Ask for a link. */
export async function POST(request: Request) {
  const rate = requestLimiter.check(clientKey(request.headers));
  if (!rate.allowed) {
    return json({ message: "Too many requests. Please try again shortly." }, 429, {
      "Retry-After": String(rate.retryAfterSeconds),
    });
  }

  const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
  if (typeof body?.email !== "string") {
    return json({ message: "An email address is required." }, 422);
  }

  const result = await apiFetch<{ status: string }>("/v1/auth/password-reset", {
    method: "POST",
    body: { email: body.email },
  });

  if (!result.ok) {
    console.error(`[password-reset] API returned ${result.status}: ${result.detail}`);
  }

  // 202 regardless, including when the API call failed. A visitor learning
  // that our mailer is down is not worth an enumeration signal, and the
  // failure is in our logs where it belongs.
  return json({ status: "check_your_email" }, 202);
}

/** Redeem one. */
export async function PUT(request: Request) {
  const rate = confirmLimiter.check(clientKey(request.headers));
  if (!rate.allowed) {
    return json({ message: "Too many attempts. Please try again shortly." }, 429, {
      "Retry-After": String(rate.retryAfterSeconds),
    });
  }

  const body = (await request.json().catch(() => null)) as
    | { token?: unknown; password?: unknown }
    | null;

  if (typeof body?.token !== "string" || typeof body.password !== "string") {
    return json({ message: "That link is not valid." }, 400);
  }

  const result = await apiFetch<void>("/v1/auth/password-reset/confirm", {
    method: "POST",
    body: { token: body.token, password: body.password },
  });

  if (result.ok) {
    return new Response(null, { status: 204, headers: NO_STORE });
  }

  if (result.status === 422) {
    return json({ message: result.detail || "That password is too short." }, 422);
  }

  return json(
    { message: "That link is invalid or has expired. Ask for a new one." },
    result.status === 400 ? 400 : 502,
  );
}
