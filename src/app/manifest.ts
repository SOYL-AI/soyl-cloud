import type { MetadataRoute } from "next";

/**
 * Declared so the icons browsers use outside the tab strip — Android home
 * screen, Windows pinned sites — resolve to real assets rather than to the
 * 96px favicon scaled up. Regenerate the icons with `node scripts/generate-icons.mjs`.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SOYL Cloud — AI Concierge for Modern Hotels",
    short_name: "SOYL Cloud",
    description:
      "Resolve guest requests in under 30 seconds. AI-powered concierge, property management, and operations — unified on one platform.",
    start_url: "/",
    display: "browser",
    background_color: "#FFFFFF",
    theme_color: "#1A1F25",
    icons: [
      { src: "/favicon.ico", sizes: "16x16 32x32 48x48", type: "image/x-icon" },
      { src: "/icon.png", sizes: "96x96", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
