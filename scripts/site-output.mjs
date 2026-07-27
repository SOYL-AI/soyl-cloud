/**
 * Small readers over Next's prerendered output in `.next/server/app`.
 *
 * Everything on this site is static, so the built files are exactly what a
 * crawler receives. Asserting against them is the only way to check SEO
 * invariants that cannot be fooled by a refactor of the components that
 * produce them. Run `npm run build` first.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const BUILD_DIR = path.join(ROOT, ".next/server/app");

export function requireBuild() {
  if (!existsSync(BUILD_DIR)) {
    throw new Error(
      `No prerendered output at ${BUILD_DIR}. Run \`npm run build\` before this check.`,
    );
  }
}

export function htmlFiles(dir = BUILD_DIR) {
  requireBuild();
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(full);
    return entry.name.endsWith(".html") ? [full] : [];
  });
}

/** `.next/server/app/blog/foo.html` → `/blog/foo`; `index.html` → `/`. */
export function routeOf(file) {
  const relative = path.relative(BUILD_DIR, file).split(path.sep).join("/");
  const route = "/" + relative.replace(/\.html$/, "");
  return route === "/index" ? "/" : route;
}

/** Routes Next generates for error states. Never indexed, markup not ours. */
export const GENERATED_ROUTES = new Set(["/_global-error", "/_not-found"]);

/** @returns {{route: string, file: string, html: string}[]} sorted by route */
export function pages() {
  return htmlFiles()
    .map((file) => ({ route: routeOf(file), file, html: readFileSync(file, "utf8") }))
    .filter((page) => !GENERATED_ROUTES.has(page.route))
    .sort((a, b) => a.route.localeCompare(b.route));
}

export function sitemapXml() {
  requireBuild();
  return readFileSync(path.join(BUILD_DIR, "sitemap.xml.body"), "utf8");
}

export function robotsTxt() {
  requireBuild();
  return readFileSync(path.join(BUILD_DIR, "robots.txt.body"), "utf8");
}
