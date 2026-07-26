/**
 * Reads the prerendered HTML in `.next/server/app` and reports the heading
 * structure of every route.
 *
 * This exists because five routes shipped with no `<h1>` at all for months
 * (REPO-AUDIT.md §7) and nothing would have told us. The site is fully
 * prerendered, so the built HTML is exactly what a crawler sees — checking it
 * is cheap and is the only check that cannot be fooled by a component
 * refactor.
 *
 * Consumed by `scripts/headings.test.mts`. Also runnable directly:
 *
 *   npm run build && node scripts/headings.mjs
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const BUILD_DIR = path.join(ROOT, ".next/server/app");

/**
 * Routes excluded from the one-`<h1>` rule.
 *
 * Next.js generates these; they are error states, never indexed, and we do not
 * own their markup.
 */
const EXCLUDED = new Set(["/_global-error", "/_not-found"]);

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(full);
    return entry.name.endsWith(".html") ? [full] : [];
  });
}

/** `.next/server/app/blog/foo.html` → `/blog/foo`; `index.html` → `/`. */
function routeOf(file) {
  const relative = path.relative(BUILD_DIR, file).split(path.sep).join("/");
  const route = "/" + relative.replace(/\.html$/, "");
  return route === "/index" ? "/" : route;
}

/**
 * Strips `<script>` and `<style>` bodies so that heading tags appearing inside
 * JSON-LD or inlined CSS are not counted as page headings.
 */
function stripNonMarkup(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
}

/** @returns {{route: string, levels: number[], h1: string[]}[]} */
export function readHeadings() {
  if (!existsSync(BUILD_DIR)) {
    throw new Error(
      `No prerendered output at ${BUILD_DIR}. Run \`npm run build\` before this check.`,
    );
  }

  return htmlFiles(BUILD_DIR)
    .map((file) => {
      const html = stripNonMarkup(readFileSync(file, "utf8"));
      const levels = [...html.matchAll(/<h([1-6])[\s>]/gi)].map((m) => Number(m[1]));
      const h1 = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) =>
        m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(),
      );
      return { route: routeOf(file), levels, h1 };
    })
    .filter((page) => !EXCLUDED.has(page.route))
    .sort((a, b) => a.route.localeCompare(b.route));
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("headings.mjs")) {
  const pages = readHeadings();
  for (const { route, h1 } of pages) {
    const status = h1.length === 1 ? "ok  " : "FAIL";
    console.log(`${status} ${String(h1.length).padStart(2)} h1  ${route.padEnd(40)} ${h1[0] ?? ""}`);
  }
  const bad = pages.filter((p) => p.h1.length !== 1);
  console.log(`\n${pages.length} routes, ${bad.length} without exactly one <h1>.`);
  process.exitCode = bad.length === 0 ? 0 : 1;
}
