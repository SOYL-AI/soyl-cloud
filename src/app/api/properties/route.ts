import { apiFetch } from "@/lib/api-client";
import { readSession } from "@/lib/session";

/** Create a property in the caller's workspace. */

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, no-transform" } as const;

type PropertyOut = { id: string; name: string; rooms_total: number };

export async function POST(request: Request) {
  const session = await readSession();
  if (!session) {
    return Response.json(
      { message: "Your session has expired. Please sign in again." },
      { status: 401, headers: NO_STORE },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { name?: unknown; rooms_total?: unknown }
    | null;

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return Response.json({ message: "A property name is required." }, { status: 422, headers: NO_STORE });
  }

  const result = await apiFetch<PropertyOut>("/v1/properties", {
    method: "POST",
    sessionToken: session.sessionToken,
    body: { name, rooms_total: Number(body?.rooms_total) || 0 },
  });

  if (result.ok) {
    return Response.json(result.data, { status: 201, headers: NO_STORE });
  }

  // 403 is a real answer here: a manager may add a property, an analyst may
  // not, and saying so is more useful than a generic failure.
  if (result.status === 403) {
    return Response.json(
      { message: "You do not have permission to add a property." },
      { status: 403, headers: NO_STORE },
    );
  }

  console.error(`[properties] API returned ${result.status}: ${result.detail}`);
  return Response.json(
    { message: "We could not add that property just now." },
    { status: 502, headers: NO_STORE },
  );
}
