import { apiFetch } from "@/lib/api-client";
import { readSession } from "@/lib/session";

/** Confirm an upload landed and queue ingestion. */

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, no-transform" } as const;

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await readSession();
  if (!session) {
    return Response.json({ message: "Your session has expired." }, { status: 401, headers: NO_STORE });
  }

  const { id } = await context.params;
  const result = await apiFetch<{ status: string }>(`/v1/documents/${id}/ingest`, {
    method: "POST",
    sessionToken: session.sessionToken,
  });

  if (result.ok) {
    return Response.json(result.data, { status: 202, headers: NO_STORE });
  }

  // 409 means the bytes never arrived — worth saying plainly, because the fix
  // is "try again" rather than anything mysterious.
  const message =
    result.status === 409
      ? "The upload did not finish. Please try again."
      : result.status === 413
        ? result.detail
        : "We could not start processing that document.";

  return Response.json(
    { message },
    { status: [409, 413, 404].includes(result.status) ? result.status : 502, headers: NO_STORE },
  );
}
