import { apiFetch } from "@/lib/api-client";
import { clientKey, createRateLimiter } from "@/lib/rate-limit";

/**
 * Signup, proxied to the API.
 *
 * The rate limit lives here rather than on the API because this is the edge
 * the internet reaches. Same limiter as the contact form — in-process and
 * per-instance until Redis arrives — but stricter, because a script hammering
 * signup is spending our Argon2 budget and our Resend quota at once.
 */

export const dynamic = "force-dynamic";

const limiter = createRateLimiter({ limit: 5, windowMs: 15 * 60 * 1000 });

const NO_STORE = { "Cache-Control": "no-store, no-transform" } as const;

function json(body: unknown, status: number, headers: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { ...NO_STORE, ...headers } });
}

export async function POST(request: Request) {
  const rate = limiter.check(clientKey(request.headers));
  if (!rate.allowed) {
    return json(
      { message: "Too many attempts from this connection. Please try again shortly." },
      429,
      { "Retry-After": String(rate.retryAfterSeconds) },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ message: "We could not read that submission." }, 400);
  }

  const { email, password, display_name } = (body ?? {}) as {
    email?: unknown;
    password?: unknown;
    display_name?: unknown;
  };

  if (typeof email !== "string" || typeof password !== "string") {
    return json({ message: "Email and password are required." }, 422);
  }

  const result = await apiFetch<{ status: string }>("/v1/auth/signup", {
    method: "POST",
    body: {
      email,
      password,
      display_name: typeof display_name === "string" && display_name ? display_name : null,
    },
  });

  if (result.ok) {
    // 202 for a new address and for one already registered. The API answers
    // identically on purpose; passing the status straight through keeps it
    // that way.
    return json({ status: "check_your_email" }, 202);
  }

  // The API's 422 is the password policy, which is safe to surface. Anything
  // else becomes a generic message rather than leaking the API's wording.
  if (result.status === 422) {
    return json({ message: result.detail || "That password is too short." }, 422);
  }

  console.error(`[signup] API returned ${result.status}: ${result.detail}`);
  return json({ message: "We could not create that account just now." }, 502);
}
