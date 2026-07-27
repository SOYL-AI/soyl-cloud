/**
 * Server-side calls to the API.
 *
 * Everything the browser needs from the API goes through a route handler that
 * uses this. Two reasons, both structural:
 *
 * 1. `API_BASE_URL` is not `NEXT_PUBLIC_`, so the API's address is never
 *    compiled into a client bundle. The browser talks to `www.soyl.cloud` and
 *    nothing else.
 * 2. The session token lives in the encrypted NextAuth JWT and is read
 *    server-side only. A browser that could call the API directly would need
 *    to hold that token, which is the exfiltration class §23.1 avoids.
 */

const REQUEST_TIMEOUT_MS = 10_000;

export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; detail: string };

function baseUrl(): string {
  const base = process.env.API_BASE_URL?.trim();
  if (!base) throw new Error("API_BASE_URL is not set");
  return base.replace(/\/+$/, "");
}

export async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; sessionToken?: string } = {},
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.sessionToken) {
    headers.Authorization = `Bearer ${options.sessionToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl()}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (cause) {
    const timedOut = cause instanceof Error && cause.name === "TimeoutError";
    return {
      ok: false,
      status: 504,
      detail: timedOut ? "The server took too long to respond." : "Could not reach the server.",
    };
  }

  if (response.status === 204) {
    return { ok: true, status: 204, data: undefined as T };
  }

  const payload = (await response.json().catch(() => null)) as
    | { detail?: string }
    | T
    | null;

  if (!response.ok) {
    const detail =
      payload && typeof payload === "object" && "detail" in payload
        ? String((payload as { detail?: unknown }).detail ?? "")
        : "";
    return { ok: false, status: response.status, detail };
  }

  return { ok: true, status: response.status, data: payload as T };
}
