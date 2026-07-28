import { apiFetch } from "@/lib/api-client";
import { readSession } from "@/lib/session";

/** Erase a document: the row, its chunks and questions, and the stored file. */

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, no-transform" } as const;

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await readSession();
  if (!session) {
    return Response.json({ message: "Your session has expired." }, { status: 401, headers: NO_STORE });
  }

  const { id } = await context.params;
  const result = await apiFetch<void>(`/v1/documents/${id}`, {
    method: "DELETE",
    sessionToken: session.sessionToken,
  });

  if (result.ok || result.status === 404) {
    // 404 is success from the caller's point of view: the document is gone,
    // which is what was asked for.
    return new Response(null, { status: 204, headers: NO_STORE });
  }

  console.error(`[documents] delete failed ${result.status}: ${result.detail}`);
  return Response.json(
    { message: "We could not delete that document." },
    { status: 502, headers: NO_STORE },
  );
}
