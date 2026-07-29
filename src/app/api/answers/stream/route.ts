import { readSession } from "@/lib/session";

/**
 * The streaming ask route.
 *
 * The response body is passed through untouched rather than read and
 * re-emitted. Buffering it here to inspect it would defeat the entire point:
 * the user would wait exactly as long as before, and see nothing until the end.
 *
 * `apiFetch` is deliberately not used — it parses the body as JSON, which for a
 * stream means awaiting the last byte. This is the one place that talks to the
 * API directly, and the tradeoff is that it repeats the base URL and auth
 * header by hand.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function baseUrl(): string {
  const base = process.env.API_BASE_URL?.trim();
  if (!base) throw new Error("API_BASE_URL is not set");
  return base.replace(/\/+$/, "");
}

/**
 * `UPDATE.md` §6.7. `no-transform` is the half that gets forgotten and the one
 * that matters most here: it is what stops a compressing proxy holding bytes
 * back until it has a full window, which turns a stream into a slow request.
 */
const STREAM_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-store, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
} as const;

export async function POST(request: Request) {
  const session = await readSession();
  if (!session) {
    return Response.json(
      { message: "Your session has expired." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const body = await request.text();

  let upstream: Response;
  try {
    upstream = await fetch(`${baseUrl()}/v1/answers/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.sessionToken}`,
      },
      body,
      // Forwards the client disconnecting, so a user navigating away stops the
      // work rather than leaving it running against a socket nobody reads.
      signal: request.signal,
      cache: "no-store",
    });
  } catch {
    return Response.json(
      { message: "Could not reach the server." },
      { status: 504, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!upstream.ok || !upstream.body) {
    return Response.json(
      { message: "We could not answer that just now." },
      { status: upstream.status === 401 ? 401 : 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  return new Response(upstream.body, { status: 200, headers: STREAM_HEADERS });
}
