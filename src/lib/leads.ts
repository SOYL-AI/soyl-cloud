/**
 * Persisting a lead to the API.
 *
 * Deliberately **best effort**. `DECISIONS.md` §4 makes email the notification
 * path and the `leads` table the record; M1's acceptance criterion 6 is
 * explicit that if the database write fails the email still sends and the
 * visitor still sees success. So this never throws, and the caller does not
 * branch on it — a lead that reached a monitored inbox is not lost, whatever
 * Postgres did.
 *
 * The API owns the database. The web app has no driver and no `DATABASE_URL`,
 * which keeps the RLS-role story in one place and avoids a serverless function
 * opening connections to Postgres on every submission.
 */

import type { LeadCreate, LeadCreated } from "@soyl/contracts";
import type { EnvLike } from "./env";

/** Long enough for a cold Railway container, short enough not to hold the form. */
const PERSIST_TIMEOUT_MS = 4_000;

export type PersistResult =
  | { persisted: true; id: string }
  | { persisted: false; reason: string };

export function readLeadApiConfig(env: EnvLike = process.env): {
  baseUrl: string;
  token: string;
} | null {
  const baseUrl = env.API_BASE_URL?.trim();
  const token = env.LEAD_INGEST_TOKEN?.trim();

  // Absent is a valid state, not an error: until the API is deployed the form
  // still works and still emails. It is logged by the caller, not thrown.
  if (!baseUrl || !token) return null;

  return { baseUrl: baseUrl.replace(/\/+$/, ""), token };
}

export async function persistLead(
  lead: LeadCreate,
  config: { baseUrl: string; token: string },
): Promise<PersistResult> {
  try {
    const response = await fetch(`${config.baseUrl}/v1/leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.token}`,
      },
      body: JSON.stringify(lead),
      signal: AbortSignal.timeout(PERSIST_TIMEOUT_MS),
      cache: "no-store",
    });

    if (!response.ok) {
      return { persisted: false, reason: `http_${response.status}` };
    }

    const body = (await response.json().catch(() => null)) as LeadCreated | null;
    return { persisted: true, id: body?.id ?? "" };
  } catch (cause) {
    const timedOut = cause instanceof Error && cause.name === "TimeoutError";
    return { persisted: false, reason: timedOut ? "timeout" : "unreachable" };
  }
}
