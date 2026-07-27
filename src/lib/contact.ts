/**
 * Validation for the contact form.
 *
 * Deliberately dependency-free and pure so it can be unit-tested without a
 * server — `src/lib/contact.test.mts` exercises it directly. The route handler
 * in `src/app/api/contact/route.ts` is the only caller.
 */

/** Name of the hidden field bots fill in and humans never see. */
export const HONEYPOT_FIELD = "website";

export const LIMITS = {
  name: 120,
  email: 200,
  company: 160,
  message: 5_000,
} as const;

/** Shortest message we will accept. Anything less is not a lead. */
export const MIN_MESSAGE_LENGTH = 10;

export type ContactSubmission = {
  name: string;
  email: string;
  company: string;
  message: string;
};

export type ContactFieldError = { field: keyof ContactSubmission; message: string };

export type ParseResult =
  | { ok: true; value: ContactSubmission }
  /**
   * `spam: true` means the honeypot was filled. The caller should respond as
   * if the submission succeeded — telling a bot it was detected only teaches
   * it to try again — but must not send an email.
   */
  | { ok: false; spam: true }
  | { ok: false; spam: false; errors: ContactFieldError[] };

/**
 * Permissive on purpose. The address is verified by whether the reply arrives,
 * not by a regex; the job here is to reject obvious nonsense and anything that
 * could be used to smuggle a header into the outgoing email.
 */
const EMAIL_PATTERN = /^[^\s@,;:<>"]+@[^\s@,;:<>".]+\.[^\s@,;:<>"]{2,}$/;

/**
 * A control character in a single-line field is a header-injection attempt,
 * not a typo. Written as a code-point scan rather than a regex range so the
 * intent survives anyone reformatting the file.
 */
function hasControlCharacter(value: string): boolean {
  return [...value].some((character) => {
    const code = character.codePointAt(0) ?? 0;
    return code < 0x20 || code === 0x7f;
  });
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parseContactSubmission(raw: unknown): ParseResult {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, spam: false, errors: [{ field: "message", message: "Malformed request." }] };
  }

  const body = raw as Record<string, unknown>;

  // Checked before validation: a bot that also sends garbage should still get
  // the silent-success path rather than a field-by-field map of what to fix.
  if (asString(body[HONEYPOT_FIELD]).length > 0) {
    return { ok: false, spam: true };
  }

  const value: ContactSubmission = {
    name: asString(body.name),
    email: asString(body.email),
    company: asString(body.company),
    message: asString(body.message),
  };

  const errors: ContactFieldError[] = [];

  if (!value.name) {
    errors.push({ field: "name", message: "Please tell us your name." });
  } else if (value.name.length > LIMITS.name) {
    errors.push({ field: "name", message: `Name must be under ${LIMITS.name} characters.` });
  } else if (hasControlCharacter(value.name)) {
    errors.push({ field: "name", message: "Name contains invalid characters." });
  }

  if (!value.email) {
    errors.push({ field: "email", message: "Please give us an email address to reply to." });
  } else if (value.email.length > LIMITS.email || !EMAIL_PATTERN.test(value.email)) {
    errors.push({ field: "email", message: "That does not look like an email address." });
  }

  if (!value.company) {
    errors.push({ field: "company", message: "Please tell us which property you're with." });
  } else if (value.company.length > LIMITS.company) {
    errors.push({ field: "company", message: `Company must be under ${LIMITS.company} characters.` });
  } else if (hasControlCharacter(value.company)) {
    errors.push({ field: "company", message: "Company contains invalid characters." });
  }

  if (value.message.length < MIN_MESSAGE_LENGTH) {
    errors.push({ field: "message", message: "Please add a little more detail." });
  } else if (value.message.length > LIMITS.message) {
    errors.push({ field: "message", message: `Message must be under ${LIMITS.message} characters.` });
  }

  return errors.length > 0 ? { ok: false, spam: false, errors } : { ok: true, value };
}

/**
 * Renders the notification sent to the monitored inbox.
 *
 * Plain text on purpose: it is a lead notification read on a phone, HTML adds
 * a rendering surface and a spam-score risk for nothing. The visitor's message
 * is quoted verbatim at the end where no formatting can swallow it.
 */
export function formatLeadEmail(
  submission: ContactSubmission,
  meta: { receivedAt: Date; source: string },
): { subject: string; text: string } {
  return {
    subject: `Contact form — ${submission.name}, ${submission.company}`,
    text: [
      `Name:     ${submission.name}`,
      `Email:    ${submission.email}`,
      `Company:  ${submission.company}`,
      `Received: ${meta.receivedAt.toISOString()}`,
      `Source:   ${meta.source}`,
      "",
      "Message",
      "-------",
      submission.message,
      "",
      `Reply to this email to answer ${submission.name} directly.`,
    ].join("\n"),
  };
}
