import { test } from "node:test";
import assert from "node:assert/strict";

import { pages, sitemapXml, robotsTxt } from "./site-output.mjs";
import { SITE_HOST, SITE_URL } from "../src/lib/constants.ts";

type Page = { route: string; file: string; html: string };

const built: Page[] = pages();

/** Every soyl-owned absolute URL appearing anywhere in a document. */
function soylUrls(text: string): string[] {
  return [...text.matchAll(/https?:\/\/[a-z0-9.-]*soyl[a-z0-9.-]*(?:\/[^\s"'<>)]*)?/gi)].map(
    (match) => match[0],
  );
}

function tag(html: string, pattern: RegExp): string | undefined {
  return html.match(pattern)?.[1];
}

/**
 * A page carrying `noindex` is deliberately outside the canonical rule.
 *
 * A canonical says "this is the URL to index"; noindex says "do not index
 * this". Declaring both is a contradictory signal, and the auth surface —
 * /login, /signup, /verify-email and friends — genuinely should not be
 * indexed: some of those URLs carry single-use tokens in the query string.
 */
function isNoIndex(html: string): boolean {
  const robots = tag(html, /<meta name="robots" content="([^"]+)"/);
  return Boolean(robots?.includes("noindex"));
}

test("every indexable route declares a canonical pointing at itself", () => {
  const offenders: string[] = [];

  for (const page of built) {
    if (isNoIndex(page.html)) continue;

    const canonical = tag(page.html, /<link rel="canonical" href="([^"]+)"/);
    if (!canonical) {
      offenders.push(`${page.route} — no canonical`);
      continue;
    }
    // Next resolves the home page's canonical to the bare origin, no trailing
    // slash. The sitemap matches it.
    const expected = page.route === "/" ? SITE_URL : `${SITE_URL}${page.route}`;
    if (canonical !== expected) {
      offenders.push(`${page.route} — canonical is ${canonical}, expected ${expected}`);
    }
  }

  assert.deepEqual(offenders, [], `canonical defects:\n  ${offenders.join("\n  ")}`);
});

test("no soyl URL anywhere in the rendered HTML uses a host other than the canonical one", () => {
  const offenders: string[] = [];

  for (const page of built) {
    for (const url of soylUrls(page.html)) {
      const host = new URL(url).host;
      // linkedin.com/company/soyl-ai and similar third-party profiles are not ours.
      if (host.endsWith("soyl.cloud") && host !== SITE_HOST) {
        offenders.push(`${page.route} — ${url}`);
      }
      if (!host.endsWith("soyl.cloud")) {
        offenders.push(`${page.route} — ${url} (not a soyl.cloud host at all)`);
      }
    }
  }

  assert.deepEqual(offenders, [], `wrong-host URLs:\n  ${offenders.join("\n  ")}`);
});

test("og:url agrees with the canonical", () => {
  const offenders: string[] = [];

  for (const page of built) {
    const canonical = tag(page.html, /<link rel="canonical" href="([^"]+)"/);
    const ogUrl = tag(page.html, /<meta property="og:url" content="([^"]+)"/);
    if (ogUrl && canonical && ogUrl !== canonical) {
      offenders.push(`${page.route} — og:url ${ogUrl} vs canonical ${canonical}`);
    }
  }

  assert.deepEqual(offenders, [], `og:url mismatches:\n  ${offenders.join("\n  ")}`);
});

test("every sitemap URL uses the canonical host", () => {
  const locs = [...sitemapXml().matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  assert.ok(locs.length > 30, `sitemap has only ${locs.length} URLs`);
  assert.deepEqual(
    locs.filter((loc) => loc !== SITE_URL && !loc.startsWith(`${SITE_URL}/`)),
    [],
    "sitemap URLs not on the canonical origin",
  );
});

test("every canonical is present in the sitemap", () => {
  const locs = new Set([...sitemapXml().matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
  const missing = built
    .map((page) => tag(page.html, /<link rel="canonical" href="([^"]+)"/))
    .filter((canonical): canonical is string => Boolean(canonical))
    .filter((canonical) => !locs.has(canonical));

  assert.deepEqual(missing, [], `canonicals absent from the sitemap:\n  ${missing.join("\n  ")}`);
});

test("robots.txt points at the sitemap on the canonical host", () => {
  assert.match(robotsTxt(), new RegExp(`^Sitemap: ${SITE_URL}/sitemap\\.xml$`, "m"));
});


// The other half of the exemption above. Without this, dropping a canonical
// from any page would silently exempt it from the rule rather than failing —
// the exemption has to be something a page opts into loudly.
test("every auth route is noindex", () => {
  const authRoutes = [
    "/login",
    "/signup",
    "/verify-email",
    "/reset-password",
    "/forgot-password",
    "/onboarding",
  ];

  const offenders: string[] = [];
  for (const route of authRoutes) {
    const page = built.find((candidate) => candidate.route === route);
    if (!page) {
      offenders.push(`${route} — route not built`);
      continue;
    }
    if (!isNoIndex(page.html)) {
      offenders.push(`${route} — is indexable and should not be`);
    }
  }

  assert.deepEqual(offenders, [], `indexable auth routes: ${offenders.join(", ")}`);
});
