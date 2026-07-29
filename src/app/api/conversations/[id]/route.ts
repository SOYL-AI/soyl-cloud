import { apiFetch } from "@/lib/api-client";
import { readSession } from "@/lib/session";

/** One conversation, with every turn and its stored envelope. */

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, no-transform" } as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await readSession();
  if (!session) {
    return Response.json({ message: "Your session has expired." }, { status: 401, headers: NO_STORE });
  }

  const { id } = await params;

  const result = await apiFetch<unknown[]>(`/v1/conversations/${id}`, {
    sessionToken: session.sessionToken,
  });

  if (!result.ok) {
    // 404 is passed through rather than flattened: another tenant's
    // conversation and one that never existed are indistinguishable by design,
    // and both should read as "not found" rather than "something broke".
    if (result.status === 404) {
      return Response.json({ message: "No such conversation." }, { status: 404, headers: NO_STORE });
    }
    console.error(`[conversations] load failed ${result.status}: ${result.detail}`);
    return Response.json({ message: "We could not load that conversation." }, { status: 502, headers: NO_STORE });
  }

  return Response.json(result.data, { status: 200, headers: NO_STORE });
}
