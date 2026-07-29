import { apiFetch } from "@/lib/api-client";
import { readSession } from "@/lib/session";

/** The conversation list for the ask sidebar. */

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, no-transform" } as const;

export async function GET() {
  const session = await readSession();
  if (!session) {
    return Response.json({ message: "Your session has expired." }, { status: 401, headers: NO_STORE });
  }

  const result = await apiFetch<unknown[]>("/v1/conversations", {
    sessionToken: session.sessionToken,
  });

  if (!result.ok) {
    // 409 means no workspace yet, which is not an error worth surfacing on a
    // page whose sidebar is incidental — an empty list reads correctly.
    if (result.status === 409) return Response.json([], { status: 200, headers: NO_STORE });
    console.error(`[conversations] list failed ${result.status}: ${result.detail}`);
    return Response.json({ message: "We could not load your history." }, { status: 502, headers: NO_STORE });
  }

  return Response.json(result.data, { status: 200, headers: NO_STORE });
}
