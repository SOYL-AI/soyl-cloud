import { apiFetch } from "@/lib/api-client";

/**
 * The public advisor.
 *
 * Anonymous by design — the whole point is that someone can try the thing
 * before signing up. That makes it the one route here that reaches a model
 * without an account behind it, so the API rate limits it in Redis by client
 * key. This handler forwards the caller's address so that limit applies to the
 * visitor rather than to Vercel.
 *
 * Without the forwarded header, every request would arrive at the API from a
 * handful of Vercel egress addresses and the limit would be effectively global
 * — one enthusiastic visitor would lock out everyone else.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const NO_STORE = { "Cache-Control": "no-store, no-transform" } as const;

function json(body: unknown, status: number) {
  return Response.json(body, { status, headers: NO_STORE });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    answers?: Record<string, unknown>;
  } | null;

  const answers = body?.answers;
  if (!answers || typeof answers !== "object") {
    return json({ message: "Answer at least one question." }, 422);
  }

  const forwarded =
    request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "";

  const result = await apiFetch<unknown>("/v1/advisor", {
    method: "POST",
    body: { answers },
    timeoutMs: 55_000,
    headers: forwarded ? { "X-Forwarded-For": forwarded } : undefined,
  });

  if (result.ok) return json(result.data, 200);

  if (result.status === 429) {
    return json(
      { message: "That is enough for now — create an account to keep going." },
      429,
    );
  }
  if (result.status === 422) return json({ message: result.detail }, 422);

  console.error(`[advisor] failed ${result.status}: ${result.detail}`);
  return json({ message: "The advisor is unavailable right now." }, 502);
}
