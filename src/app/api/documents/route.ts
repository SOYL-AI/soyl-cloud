import { apiFetch } from "@/lib/api-client";
import { readSession } from "@/lib/session";

/**
 * List documents, and reserve an upload.
 *
 * The reserve step returns a presigned URL the browser uses directly, so the
 * file never passes through Vercel — which matters both for the 4.5 MB body
 * limit and because a 40 MB PDF should not occupy a function for its whole
 * transfer.
 */

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, no-transform" } as const;

function json(body: unknown, status: number) {
  return Response.json(body, { status, headers: NO_STORE });
}

export async function GET() {
  const session = await readSession();
  if (!session) return json({ message: "Your session has expired." }, 401);

  const result = await apiFetch<unknown[]>("/v1/documents", {
    sessionToken: session.sessionToken,
  });

  if (!result.ok) {
    if (result.status === 409) return json([], 200);
    console.error(`[documents] list failed ${result.status}: ${result.detail}`);
    return json({ message: "We could not load your documents." }, 502);
  }

  return json(result.data, 200);
}

export async function POST(request: Request) {
  const session = await readSession();
  if (!session) return json({ message: "Your session has expired." }, 401);

  const body = (await request.json().catch(() => null)) as {
    filename?: unknown;
    content_type?: unknown;
  } | null;

  if (typeof body?.filename !== "string" || typeof body.content_type !== "string") {
    return json({ message: "A filename and content type are required." }, 422);
  }

  const result = await apiFetch<{ document_id: string; upload_url: string }>("/v1/documents", {
    method: "POST",
    sessionToken: session.sessionToken,
    body: { filename: body.filename, content_type: body.content_type },
  });

  if (result.ok) return json(result.data, 201);

  // 415 is a real answer worth passing through: the person picked a file type
  // we cannot read, and telling them which types we can is the useful reply.
  if (result.status === 415) {
    return json({ message: result.detail }, 415);
  }

  console.error(`[documents] reserve failed ${result.status}: ${result.detail}`);
  return json({ message: "We could not start that upload." }, 502);
}
