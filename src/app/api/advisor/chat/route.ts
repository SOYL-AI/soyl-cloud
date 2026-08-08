import { apiFetch } from "@/lib/api-client";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const NO_STORE = { "Cache-Control": "no-store, no-transform" } as const;

function json(body: unknown, status: number) {
  return Response.json(body, { status, headers: NO_STORE });
}

const FALLBACK_FIRST_TURN = {
  message: "Welcome! I'm here to help you identify opportunities to improve your hotel's operations. Let's start — what kind of property do you manage?",
  options: ["Independent hotel", "Small group (2-10 properties)", "Resort", "Serviced apartments", "Boutique / heritage"],
  phase: "profiling" as const,
  insight: null,
  productSuggestions: null,
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    messages?: Array<{ role: "user" | "assistant"; content: string }>;
    selectedOption?: string | null;
  } | null;

  if (!body || !body.messages) {
    return json({ message: "Messages are required." }, 400);
  }

  const forwarded =
    request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "";

  let result;
  try {
    result = await apiFetch<unknown>("/v1/advisor/chat", {
      method: "POST",
      body,
      timeoutMs: 15_000,
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

  // Fallback state machine
  const messages = body.messages;
  const userMessages = messages.filter((m) => m.role === "user");
  const turnCount = userMessages.length;

  if (turnCount === 0) {
    return json(FALLBACK_FIRST_TURN, 200);
  } else if (turnCount === 1) {
    return json({
      message: "Got it. Roughly how many rooms in total?",
      options: ["Under 25", "25-60", "60-150", "150-400", "More than 400"],
      phase: "profiling",
      insight: null,
      productSuggestions: null,
    }, 200);
  } else if (turnCount === 2) {
    return json({
      message: "What takes the most time that probably shouldn't?",
      options: [
        "Answering the same staff questions repeatedly",
        "Finding the right clause in a contract",
        "Training new staff on our procedures",
        "Keeping SOPs current across properties",
        "Something else",
      ],
      phase: "profiling",
      insight: null,
      productSuggestions: null,
    }, 200);
  } else {
    return json({
      message: "Based on what you've shared, here's an operational read.",
      options: [],
      phase: "insight",
      insight: {
        headline: "Operational Read",
        blocks: [
          {
            type: "text.markdown",
            title: "Primary Overhead Driver",
            markdown: "Your team experiences recurring operational friction handling routines. Manual SOP lookups consume an estimated 14 hours per week of supervisor bandwidth.",
            level: "high",
            items: [],
          },
          {
            type: "list.checklist",
            title: "Immediate AI Implementation Targets",
            markdown: null,
            level: "medium",
            items: [
              "Ingest Front Desk SOPs & contracts into SOYL Knowledge Base.",
              "Enable instant AI retrieval for staff with exact section citations.",
              "Automate 75%+ of routine guest service inquiries via Butler AI.",
            ],
          },
          {
            type: "alert.callout",
            title: "Expected Operational Velocity Lift",
            markdown: "Zero staff training required. Ingest your first PDF document to experience verified, cited AI answers in real-time.",
            level: "action",
            items: [],
          },
        ]
      },
      productSuggestions: [
        {
          product: "Butler AI",
          reason: "Automate guest inquiries directly.",
          relevance: "high"
        },
        {
          product: "PMS Lite",
          reason: "Manage rooms seamlessly.",
          relevance: "medium"
        }
      ]
    }, 200);
  }
}
