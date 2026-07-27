import { COMPANY, SITE_URL } from "@/lib/constants";
import { formatLeadEmail, parseContactSubmission } from "@/lib/contact";
import { EmailNotConfiguredError, readEmailConfig, sendEmail } from "@/lib/email";
import { clientKey, createRateLimiter } from "@/lib/rate-limit";
import { persistLead, readLeadApiConfig } from "@/lib/leads";

/**
 * The contact form's destination.
 *
 * Before this route existed, `/contact` ran a one-second `setTimeout`, showed
 * "Message sent!" and discarded the submission (REPO-AUDIT.md §6). The single
 * rule this handler exists to enforce: **it must never report success unless
 * an email provider accepted the message.**
 *
 * DECISIONS.md §4 sequences the rest — a `leads` table in M1, an admin screen
 * in M6. Email stays the notification path throughout.
 */

/** Never prerender or cache; every request must reach the handler. */
export const dynamic = "force-dynamic";

/**
 * Five submissions per IP per ten minutes. A real enquiry is one message; a
 * person correcting a typo and resending is two or three. Five is generous for
 * a human and useless for a script.
 */
const limiter = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 });

/** Responses carry no-store so no proxy can replay a submission result. */
const NO_STORE = { "Cache-Control": "no-store, no-transform" } as const;

function json(body: unknown, status: number, headers: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { ...NO_STORE, ...headers } });
}

/**
 * Writes the lead to the API. Swallows everything.
 *
 * The email has already been accepted by the time this runs, so there is no
 * failure here that should change what the visitor sees. A failure is logged
 * with a reason so a persistently unreachable API is visible in the logs
 * rather than silently discarding the `leads` table.
 */
async function recordLead(lead: {
  name: string;
  email: string;
  company: string;
  message: string;
}): Promise<void> {
  const config = readLeadApiConfig();

  if (!config) {
    console.warn("[contact] lead not persisted: API_BASE_URL or LEAD_INGEST_TOKEN unset");
    return;
  }

  const result = await persistLead({ ...lead, source_url: `${SITE_URL}/contact` }, config);

  if (result.persisted) {
    console.info(`[contact] lead persisted id=${result.id || "unknown"}`);
  } else {
    console.error(`[contact] lead not persisted: ${result.reason}`);
  }
}

export async function POST(request: Request) {
  const key = clientKey(request.headers);
  const rate = limiter.check(key);

  if (!rate.allowed) {
    return json(
      {
        ok: false,
        error: "rate_limited",
        message: "Too many messages from this connection. Please try again shortly.",
        fallbackEmail: COMPANY.email,
      },
      429,
      { "Retry-After": String(rate.retryAfterSeconds) },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(
      { ok: false, error: "malformed", message: "We could not read that submission.", fallbackEmail: COMPANY.email },
      400,
    );
  }

  const parsed = parseContactSubmission(body);

  if (!parsed.ok && parsed.spam) {
    // Honeypot filled. Answer exactly as a success would, and send nothing.
    return json({ ok: true }, 200);
  }

  if (!parsed.ok) {
    return json({ ok: false, error: "invalid", errors: parsed.errors }, 422);
  }

  let config;
  try {
    config = readEmailConfig();
  } catch (cause) {
    // A missing key is our failure, not the visitor's. Loud in the logs,
    // honest on the page.
    console.error(
      cause instanceof EmailNotConfiguredError
        ? `[contact] ${cause.message}`
        : "[contact] failed to read email configuration",
      cause,
    );
    return json(
      {
        ok: false,
        error: "unavailable",
        message: "We could not send your message just now.",
        fallbackEmail: COMPANY.email,
      },
      503,
    );
  }

  const { subject, text } = formatLeadEmail(parsed.value, {
    receivedAt: new Date(),
    source: `${SITE_URL}/contact`,
  });

  try {
    const id = await sendEmail(
      { to: config.to, from: config.from, subject, text, replyTo: parsed.value.email },
      config,
    );
    // Enough to reconcile against the provider's dashboard. The message body
    // is never logged.
    console.info(`[contact] delivered id=${id || "unknown"} company=${parsed.value.company}`);
  } catch (cause) {
    console.error("[contact] send failed", cause);
    return json(
      {
        ok: false,
        error: "send_failed",
        message: "We could not send your message just now.",
        fallbackEmail: COMPANY.email,
      },
      502,
    );
  }

  // Only reached once the provider has accepted the message. Outside the try
  // above on purpose: nothing about persisting a record may turn a delivered
  // email into a 502 (M1 acceptance criterion 6). `recordLead` swallows its
  // own failures, and this line keeps it that way even if that changes.
  await recordLead(parsed.value);

  return json({ ok: true }, 200);
}
