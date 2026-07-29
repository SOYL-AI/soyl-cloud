import Script from "next/script";

/**
 * Plausible, loaded only when `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is set.
 *
 * That condition is the feature, not a guard: local development and preview
 * deploys leave it unset and send nothing, so the numbers in the dashboard are
 * production traffic and only production traffic.
 *
 * The `outbound-links` variant records clicks to other hosts without any
 * per-link markup — one of the four things DECISIONS.md §3 asks for on day
 * one, alongside pageviews (automatic), contact submit and Calendly
 * interaction (both via `track()` in `src/lib/analytics.ts`).
 *
 * Server component: it renders a tag and holds no state.
 */
export function Analytics() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return null;

  return (
    <>
      <Script
        defer
        data-domain={domain}
        src="https://plausible.io/js/script.outbound-links.js"
        // `lazyOnload` rather than `afterInteractive`: it waits for the browser
        // to go idle, which keeps a third-party DNS, TCP and TLS chain off the
        // path that decides LCP. Pageviews are still recorded — the queue below
        // holds any custom event fired before the script arrives.
        strategy="lazyOnload"
      />
      {/*
        Queues custom events fired before the script finishes loading. Without
        this, a fast submit on a slow connection is simply lost.
      */}
      <Script id="plausible-queue" strategy="afterInteractive">
        {`window.plausible = window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments) }`}
      </Script>
    </>
  );
}
