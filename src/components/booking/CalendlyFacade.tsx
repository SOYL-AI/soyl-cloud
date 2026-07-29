"use client";

import { CalendarDays, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { track } from "@/lib/analytics";

/**
 * The Calendly embed, loaded on click rather than on arrival.
 *
 * `BASELINE.md` measured this page at **16.8 s mobile LCP** — the slowest route
 * on the site, and the only working conversion path. The page itself is
 * trivial; the embed pulled 3.77 MB before anyone could book:
 *
 *     booking.css   1.30 MB
 *     booking.js    1.29 MB
 *     recaptcha       383 KB
 *     stripe.js       240 KB
 *     gsi/client       99 KB
 *
 * A visitor who reads the page and leaves paid all of that for nothing, and it
 * also dragged best practices to 77 on both form factors.
 *
 * The facade is our own markup, so it becomes the LCP element and renders
 * immediately. Nothing third-party loads until someone says they want to book.
 *
 * **The destination is unchanged and must stay unchanged.** The booking flow is
 * verified after every deploy (`AGENTS.md`) — this makes it faster to reach,
 * not different.
 */

const CALENDLY_URL = "https://calendly.com/siddharthpriyatam/30min";

export function CalendlyFacade() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  /**
   * Calendly posts its progress to the parent window. Without listening, the
   * booking funnel is invisible: the iframe is a third-party origin, so a
   * scheduled demo produces no pageview and no click we can see.
   *
   * Attached only once the embed exists — before that there is nothing to hear,
   * and a listener on every visit to a page nobody books from is waste.
   */
  useEffect(() => {
    if (!open) return;

    function onMessage(event: MessageEvent) {
      if (!event.origin.includes("calendly.com")) return;

      const name = (event.data as { event?: unknown } | null)?.event;
      if (typeof name !== "string" || !name.startsWith("calendly.")) return;

      track("Calendly Interaction", { stage: name.replace("calendly.", "") });
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [open]);

  if (!open) {
    return (
      <div className="rounded-2xl border border-charcoal/10 bg-white p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-mint/25">
          <CalendarDays className="h-5 w-5 text-charcoal" aria-hidden />
        </div>
        <h2 className="text-lg font-semibold text-charcoal">
          Thirty minutes, and you pick the time
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-charcoal/65">
          We will walk through your actual operation, show you the product against a
          document like one of yours, and answer whatever you want to ask. No slides.
        </p>

        <button
          onClick={() => {
            setOpen(true);
            track("Demo Booking Started");
          }}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-charcoal px-6 py-3 text-sm font-semibold text-white transition hover:bg-charcoal/90"
        >
          <CalendarDays className="h-4 w-4" aria-hidden />
          Choose a time
        </button>

        <p className="mt-4 text-[11px] text-charcoal/45">
          Opens our scheduling tool, Calendly. Nothing loads from them until you click.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-[700px] w-full overflow-hidden rounded-2xl border border-charcoal/10 bg-white">
      {!ready ? (
        <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-charcoal/55">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading the calendar…
        </div>
      ) : null}

      <iframe
        src={CALENDLY_URL}
        title="Book a demo"
        width="100%"
        height="100%"
        onLoad={() => setReady(true)}
        className="relative h-full w-full"
      />
    </div>
  );
}
