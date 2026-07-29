import { apiFetch } from "@/lib/api-client";
import { readSession } from "@/lib/session";

import type { AskResponse } from "@soyl/contracts";

/**
 * Ask a question of your own documents.
 *
 * A thin pass-through, deliberately. The pipeline, the provenance validation
 * and the refusal decision all live in the API — putting any of that here would
 * mean two implementations of "is this answer allowed to be shown", and the one
 * in the browser's reach is the one that would drift.
 *
 * The long timeout is the honest part: retrieval embeds, reranks and
 * synthesises, which is three provider round trips. `apiFetch`'s default would
 * abort a perfectly healthy answer.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const NO_STORE = { "Cache-Control": "no-store, no-transform" } as const;

function json(body: unknown, status: number) {
  return Response.json(body, { status, headers: NO_STORE });
}

export async function POST(request: Request) {
  const session = await readSession();
  if (!session) return json({ message: "Your session has expired." }, 401);

  const body = (await request.json().catch(() => null)) as {
    question?: unknown;
    conversation_id?: unknown;
  } | null;

  const question = typeof body?.question === "string" ? body.question.trim() : "";
  if (!question) return json({ message: "Ask a question." }, 422);

  const result = await apiFetch<AskResponse>("/v1/answers", {
    method: "POST",
    sessionToken: session.sessionToken,
    body: {
      question,
      conversation_id:
        typeof body?.conversation_id === "string" ? body.conversation_id : null,
    },
    timeoutMs: 55_000,
  });

  if (result.ok) return json(result.data, 200);

  // 422 is the guard talking — the question was empty or enormous — and its
  // message is written for the person who typed it, so it is passed through
  // rather than replaced with something vaguer.
  if (result.status === 422) return json({ message: result.detail }, 422);

  if (result.status === 503) {
    return json(
      { message: "The model provider is unavailable. Try again in a moment." },
      503,
    );
  }

  console.error(`[answers] ask failed ${result.status}: ${result.detail}`);
  return json({ message: "We could not answer that just now." }, 502);
}
