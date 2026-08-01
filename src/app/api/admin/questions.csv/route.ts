import { readSession } from "@/lib/session";

/**
 * The questions export (`UPDATE.md` §11).
 *
 * Not through `apiFetch`, which parses JSON and would turn a CSV into a parse
 * failure. A direct fetch, streamed straight back with the API's own
 * `Content-Disposition` so the filename it chose survives.
 *
 * The filter is forwarded verbatim: an export button that ignores the filter
 * on screen is the export button everyone learns not to trust.
 */

export const dynamic = "force-dynamic";

// Longer than the 10s CRUD default. This aggregates across every tenant and is
// capped at 20,000 rows, which is a lot of rows to serialise.
const TIMEOUT_MS = 30_000;

export async function GET(request: Request) {
  const session = await readSession({ ignoreImpersonation: true });
  if (!session) {
    return Response.json({ message: "Your session has expired." }, { status: 401 });
  }

  const base = process.env.API_BASE_URL?.trim();
  if (!base) {
    return Response.json({ message: "Not configured." }, { status: 500 });
  }

  const incoming = new URL(request.url).searchParams;
  // Rebuilt rather than forwarded whole, so a `page` left over from the
  // browsing view cannot silently truncate the export to fifty rows.
  const forwarded = new URLSearchParams();
  for (const key of ["tenant_id", "status", "search", "since", "until"]) {
    const value = incoming.get(key);
    if (value) forwarded.set(key, value);
  }

  const query = forwarded.toString();
  let upstream: Response;
  try {
    upstream = await fetch(
      `${base.replace(/\/+$/, "")}/v1/admin/questions.csv${query ? `?${query}` : ""}`,
      {
        headers: { Authorization: `Bearer ${session.sessionToken}` },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      },
    );
  } catch {
    return Response.json({ message: "The export took too long." }, { status: 504 });
  }

  if (!upstream.ok) {
    return Response.json({ message: "Not found." }, { status: upstream.status === 404 ? 404 : 502 });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "text/csv; charset=utf-8",
      "Content-Disposition":
        upstream.headers.get("content-disposition") ?? 'attachment; filename="questions.csv"',
      "Cache-Control": "no-store, no-transform",
    },
  });
}
