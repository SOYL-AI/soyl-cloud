import type { EnvLike } from "./env";

/**
 * Transactional email, behind one function.
 *
 * Resend's REST API over `fetch` rather than its SDK: M0 is barred from
 * dependency changes and this is a single POST. Everything provider-specific
 * lives in this file, so swapping to Postmark or SES later is one file and no
 * caller changes. This is the same seam the M2 verification and password-reset
 * mails will use.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** Give up rather than hold the visitor's browser open indefinitely. */
const SEND_TIMEOUT_MS = 8_000;

export type EmailMessage = {
  to: string;
  from: string;
  subject: string;
  text: string;
  /** Where a reply from the monitored inbox should go — the lead, not us. */
  replyTo?: string;
};

export class EmailNotConfiguredError extends Error {
  constructor(missing: string[]) {
    super(`Email is not configured: missing ${missing.join(", ")}`);
    this.name = "EmailNotConfiguredError";
  }
}

export class EmailSendError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "EmailSendError";
  }
}

export type EmailConfig = {
  apiKey: string;
  from: string;
  to: string;
};

/**
 * Reads and validates configuration at call time rather than at module load,
 * so a missing variable surfaces as a handled 502 on one route instead of a
 * boot failure that takes the whole marketing site down.
 */
export function readEmailConfig(env: EnvLike = process.env): EmailConfig {
  const apiKey = env.RESEND_API_KEY?.trim();
  const from = env.CONTACT_FROM_EMAIL?.trim();
  const to = env.CONTACT_TO_EMAIL?.trim();

  const missing = [
    !apiKey && "RESEND_API_KEY",
    !from && "CONTACT_FROM_EMAIL",
    !to && "CONTACT_TO_EMAIL",
  ].filter((name): name is string => Boolean(name));

  if (missing.length > 0) throw new EmailNotConfiguredError(missing);

  return { apiKey: apiKey!, from: from!, to: to! };
}

export async function sendEmail(message: EmailMessage, config: EmailConfig): Promise<string> {
  let response: Response;

  try {
    response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: message.from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        ...(message.replyTo ? { reply_to: [message.replyTo] } : {}),
      }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
  } catch (cause) {
    throw new EmailSendError(
      cause instanceof Error && cause.name === "TimeoutError"
        ? `Email provider did not respond within ${SEND_TIMEOUT_MS}ms`
        : `Email provider unreachable: ${cause instanceof Error ? cause.message : String(cause)}`,
    );
  }

  if (!response.ok) {
    // Body is provider diagnostics, never the visitor's message.
    const detail = await response.text().catch(() => "");
    throw new EmailSendError(
      `Email provider returned ${response.status}: ${detail.slice(0, 500)}`,
      response.status,
    );
  }

  const body = (await response.json().catch(() => ({}))) as { id?: string };
  return body.id ?? "";
}
