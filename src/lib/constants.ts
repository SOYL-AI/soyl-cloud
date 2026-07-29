/**
 * The one hostname this site declares itself to live at.
 *
 * Production serves `www.soyl.cloud` and the apex 308-redirects to it. Every
 * canonical, every sitemap `<loc>`, the robots sitemap directive and every
 * absolute URL in JSON-LD must agree with that, or we are back to declaring
 * canonicals pointing at a hostname that redirects away from itself
 * (REPO-AUDIT.md §5). `scripts/canonical.test.mts` enforces it.
 *
 * Build absolute URLs from `SITE_URL`. Never hardcode the origin.
 */
export const SITE_HOST = "www.soyl.cloud";
export const SITE_URL = `https://${SITE_HOST}`;

export const COMPANY = {
  name: "SOYL Cloud",
  /** Alias of {@link SITE_HOST} — kept so existing `https://${COMPANY.domain}` call sites stay correct. */
  domain: SITE_HOST,
  address: "Bengaluru Karnataka 560043",
  email: "ryan.gomez@soyl.cloud",
  phone: "+91 7022509965",
};

export const NAVIGATION = [
  { name: "Butler AI", href: "/products/butler-ai" },
  { name: "PMS Lite", href: "/products/pms-lite" },
  { name: "SOYL Dine", href: "/products/soyl-dine" },
  { name: "Pricing", href: "/pricing" },
  { name: "About", href: "/about" },
];

export const LEGAL = [
  { name: "Privacy Policy", href: "/legal/privacy" },
  { name: "Terms of Service", href: "/legal/terms" },
  { name: "Data Processing", href: "/legal/dpa" },
];

export const SOCIAL = [
  { name: "LinkedIn", href: "https://www.linkedin.com/company/soyl-ai/posts/?feedView=all" },
];

export const RESOURCES = [
  { name: "Blog", href: "/blog" },
  { name: "Compare Butler AI", href: "/compare" },
];
