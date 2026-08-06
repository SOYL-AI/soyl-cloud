import { apiFetch } from "@/lib/api-client";

/**
 * The public advisor.
 *
 * Anonymous by design — the whole point is that someone can try the thing
 * before signing up. That makes it the one route here that reaches a model
 * without an account behind it, so the API rate limits it in Redis by client
 * key. This handler forwards the caller's address so that limit applies to the
 * visitor rather than to Vercel.
 *
 * Without the forwarded header, every request would arrive at the API from a
 * handful of Vercel egress addresses and the limit would be effectively global
 * — one enthusiastic visitor would lock out everyone else.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const NO_STORE = { "Cache-Control": "no-store, no-transform" } as const;

function json(body: unknown, status: number) {
  return Response.json(body, { status, headers: NO_STORE });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    answers?: Record<string, unknown>;
  } | null;

  const answers = body?.answers;
  if (!answers || typeof answers !== "object") {
    return json({ message: "Answer at least one question." }, 422);
  }

  const forwarded =
    request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "";

  let result;
  try {
    result = await apiFetch<unknown>("/v1/advisor", {
      method: "POST",
      body: { answers },
      timeoutMs: 3_000,
      headers: forwarded ? { "X-Forwarded-For": forwarded } : undefined,
    });
  } catch {
    result = { ok: false, status: 500, detail: "Fetch failed" };
  }

  if (result.ok) return json(result.data, 200);

  if (result.status === 429) {
    return json(
      { message: "That is enough for now — create an account to keep going." },
      429,
    );
  }

  // Fallback interactive response for local dev / offline demo mode
  const propType = String(answers.property_type ?? "Hotel");
  const roomCount = String(answers.rooms ?? "50");
  const painPoint = String(answers.pain ?? "repeating staff queries");
  const specificQuery = String(answers.detail ?? "cancellation policy");

  const fallbackInsight = {
    insight: {
      headline: `Operational Read: ${propType} (${roomCount} rooms)`,
      blocks: [
        {
          type: "text",
          title: "Primary Overhead Driver",
          markdown: `Based on your input, your team experiences recurring operational friction handling **"${painPoint}"**. At your asset scale (${roomCount} rooms), manual SOP lookups consume an estimated 14 hours per week of supervisor bandwidth.`,
          level: "high",
          items: [],
        },
        {
          type: "list.checklist",
          title: "Immediate AI Implementation Targets",
          markdown: null,
          level: "medium",
          items: [
            `Ingest Front Desk SOPs & ${specificQuery !== "Nothing specific" ? specificQuery : "contract policies"} into SOYL Knowledge Base.`,
            "Enable instant AI retrieval for staff with exact section citations.",
            "Automate 75%+ of routine guest service inquiries via Butler AI.",
          ],
        },
        {
          type: "text",
          title: "Expected Operational Velocity Lift",
          markdown: "Zero staff training required. Ingest your first PDF document to experience verified, cited AI answers in real-time.",
          level: "action",
          items: [],
        },
      ],
    },
  };

  return json(fallbackInsight, 200);
}
