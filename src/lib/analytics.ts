/**
 * Analytics events, in one place.
 *
 * Plausible over GA4 or PostHog for a specific reason (DECISIONS.md §3): it
 * sets no cookies, so there is no consent banner, and our privacy policy could
 * not support cookie-based tracking anyway.
 *
 * Every call is a no-op when the script has not loaded — unset
 * `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`, an ad blocker, or an offline dev machine.
 * Analytics must never be able to break a page.
 */

/**
 * The complete event vocabulary. A union rather than a string so a typo is a
 * build error instead of a metric that silently never fires.
 *
 * Pageviews and outbound link clicks are recorded by the Plausible script
 * itself and are deliberately absent here.
 */
export type AnalyticsEvent =
  /** The contact form was accepted by the server. The funnel's only form conversion. */
  | "Contact Submitted"
  /** The contact form failed. `reason` distinguishes our fault from the visitor's. */
  | "Contact Failed"
  /** The visitor did something inside the Calendly iframe. `stage` says what. */
  | "Calendly Interaction"
  /**
   * The Calendly embed was requested. Distinct from "Calendly Interaction",
   * which cannot fire until the embed exists — the gap between the two is the
   * cost of the facade, and without this event that cost is invisible.
   */
  | "Demo Booking Started"
  /**
   * The signup funnel, in order. `UPDATE.md` §11's funnel screen is
   * "signups, verified, created a property, uploaded a document, asked a
   * question" — these are those steps, named so the drop-off between any two
   * is one subtraction rather than a join.
   */
  | "Signup Submitted"
  | "Email Verified"
  | "Property Created"
  | "Document Uploaded"
  | "Question Asked"
  /** The public advisor, which is the top of the funnel for anyone who tries it. */
  | "Advisor Started"
  | "Advisor Completed";

type PlausibleFunction = (
  event: string,
  options?: { props?: Record<string, string | number | boolean> },
) => void;

declare global {
  interface Window {
    plausible?: PlausibleFunction & { q?: unknown[] };
  }
}

export function track(
  event: AnalyticsEvent,
  props?: Record<string, string | number | boolean>,
): void {
  if (typeof window === "undefined") return;

  try {
    window.plausible?.(event, props ? { props } : undefined);
  } catch {
    // An analytics failure is never worth surfacing to a visitor.
  }
}
