import { apiFetch } from "@/lib/api-client";
import { readSession } from "@/lib/session";

/**
 * Re-run ingestion for a document (`UPDATE.md` §11).
 *
 * A thin proxy. Everything that matters — that the caller is staff, that the
 * job is created as the *tenant* so it satisfies `tenant_isolation`, and that
 * the action is audited separately from the read — happens in the API, because
 * that is where the database is.
 */

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, no-transform" } as const;

function json(body: unknown, status: number) {
  return Response.json(body, { status, headers: NO_STORE });
}

export async function POST(request: Request) {
  const session = await readSession({ ignoreImpersonation: true });
  if (!session) return json({ message: "Your session has expired." }, 401);

  const body = (await request.json().catch(() => null)) as { document_id?: unknown } | null;
  if (typeof body?.document_id !== "string") {
    return json({ message: "A document is required." }, 422);
  }

  const result = await apiFetch<{ status: string; job_id: string }>(
    `/v1/admin/documents/${encodeURIComponent(body.document_id)}/reprocess`,
    { method: "POST", sessionToken: session.sessionToken },
  );

  if (result.ok) return json(result.data, 202);

  if (result.status === 404) return json({ message: "Not found." }, 404);
  console.error(`[admin] reprocess failed ${result.status}: ${result.detail}`);
  return json({ message: "Could not queue that." }, 502);
}
