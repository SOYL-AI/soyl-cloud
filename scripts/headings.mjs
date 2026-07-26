/**
 * Reports the heading structure of every prerendered route.
 *
 * This exists because five routes shipped with no `<h1>` at all for months
 * (REPO-AUDIT.md §7) and nothing would have told us.
 *
 * Consumed by `scripts/headings.test.mts`. Also runnable directly:
 *
 *   npm run build && node scripts/headings.mjs
 */
import { pages } from "./site-output.mjs";

/**
 * Strips `<script>` and `<style>` bodies so heading tags appearing inside
 * JSON-LD or inlined CSS are not counted as page headings.
 */
function stripNonMarkup(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
}

/** @returns {{route: string, levels: number[], h1: string[]}[]} */
export function readHeadings() {
  return pages().map(({ route, html }) => {
    const markup = stripNonMarkup(html);
    const levels = [...markup.matchAll(/<h([1-6])[\s>]/gi)].map((m) => Number(m[1]));
    const h1 = [...markup.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) =>
      m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(),
    );
    return { route, levels, h1 };
  });
}

if (process.argv[1]?.endsWith("headings.mjs")) {
  const report = readHeadings();
  for (const { route, h1 } of report) {
    const status = h1.length === 1 ? "ok  " : "FAIL";
    console.log(`${status} ${String(h1.length).padStart(2)} h1  ${route.padEnd(40)} ${h1[0] ?? ""}`);
  }
  const bad = report.filter((page) => page.h1.length !== 1);
  console.log(`\n${report.length} routes, ${bad.length} without exactly one <h1>.`);
  process.exitCode = bad.length === 0 ? 0 : 1;
}
