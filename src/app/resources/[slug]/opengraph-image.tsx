import { ImageResponse } from "next/og";

import { RESOURCES, getResource } from "@/lib/resources";

/**
 * A per-article OpenGraph card.
 *
 * This is where generated images earn their keep. A resource article shared in
 * a WhatsApp group of hotel managers — which is how this material actually
 * travels — shows its own title rather than a generic company card, and the
 * difference between "SOYL Cloud" and "The SOPs every hotel should have
 * written down" is the difference between a link somebody opens and one they
 * scroll past.
 *
 * Generated at build time via `generateStaticParams`, so it costs nothing at
 * request time and cannot fail while somebody is waiting.
 */

export const alt = "SOYL Cloud resource";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return RESOURCES.map((resource) => ({ slug: resource.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resource = getResource(slug);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#FFFFFF",
          padding: "72px",
          fontFamily: "sans-serif",
          borderTop: "14px solid #B8E5D3",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#5B6472",
          }}
        >
          {resource?.category ?? "Resources"}
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 60,
            fontWeight: 800,
            color: "#1C1C1C",
            lineHeight: 1.12,
            letterSpacing: "-0.02em",
            maxWidth: 980,
          }}
        >
          {resource?.title ?? "Resources for hotel operators"}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24 }}>
          <div style={{ display: "flex", color: "#1C1C1C", fontWeight: 700 }}>SOYL Cloud</div>
          <div style={{ display: "flex", color: "#5B6472" }}>
            {resource?.readTime ?? "soyl.cloud"}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
