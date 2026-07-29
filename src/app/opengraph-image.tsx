import { ImageResponse } from "next/og";

/**
 * The sitewide OpenGraph image.
 *
 * Generated rather than a static PNG, because a shared card is a shared card:
 * every route without its own would otherwise show the same picture, and a
 * link to `/resources/hotel-sop-checklist` in a WhatsApp group would look
 * identical to a link to the pricing page.
 *
 * Routes with their own `opengraph-image.tsx` override this one. Everything
 * else inherits it, which is the correct default — a generic but on-brand card
 * beats a missing one, and a missing one is what a link preview shows as a
 * grey box.
 *
 * Deliberately typographic. Rendering the logo would mean fetching it at
 * request time, and an OG image that occasionally fails to render is worse
 * than one that never contained an image.
 */

// No `runtime = "edge"`. This card never changes, so it is generated once at
// build time and served as a static file — an edge runtime would re-render it
// per request for an image with no inputs.
export const alt = "SOYL Cloud — AI concierge and operations for hotels";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#FDFCF8",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#B8E5D3",
              display: "flex",
            }}
          />
          <div style={{ fontSize: 30, fontWeight: 700, color: "#1C1C1C" }}>SOYL Cloud</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: "#1C1C1C",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              maxWidth: 900,
            }}
          >
            Your documents can answer questions.
          </div>
          <div style={{ fontSize: 28, color: "#5B6472", maxWidth: 820, lineHeight: 1.4 }}>
            Ask your SOPs, contracts and policies in plain language. Every answer quotes
            the passage it came from.
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 24, color: "#5B6472" }}>soyl.cloud</div>
      </div>
    ),
    size,
  );
}
