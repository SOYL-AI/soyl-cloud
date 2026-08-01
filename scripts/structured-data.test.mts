/**
 * Structured data must parse and carry what Google requires.
 *
 * `UPDATE.md` §12 makes "structured data validates" an M5 acceptance
 * criterion, and until this existed the only thing checking it was me
 * remembering to look. It caught two real defects the first time it ran:
 * `Article` with no `image` (which makes an article ineligible for rich
 * results, i.e. the entire point of the markup), and a duplicate
 * `Organization` block added without noticing the layout already emitted a
 * richer one.
 *
 * It reads the built HTML rather than hitting the network, so it runs in CI
 * without a deploy — the same approach `canonical.test.mts` takes.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const BUILD = join(process.cwd(), ".next", "server", "app");

/** Routes that must carry structured data, and what each must have. */
const EXPECTED: { route: string; file: string; types: string[] }[] = [
  { route: "/", file: "index.html", types: ["Organization", "WebSite"] },
  {
    route: "/resources/hotel-sop-checklist",
    file: join("resources", "hotel-sop-checklist.html"),
    types: ["Article", "BreadcrumbList"],
  },
  {
    route: "/products/butler-ai",
    file: join("products", "butler-ai.html"),
    types: ["FAQPage"],
  },
];

/**
 * Properties Google requires for a rich result. Not the full schema.org
 * vocabulary — only the fields whose absence makes the markup pointless.
 */
const REQUIRED: Record<string, string[]> = {
  Article: ["headline", "image", "datePublished", "dateModified", "author", "publisher"],
  BreadcrumbList: ["itemListElement"],
  Organization: ["name", "url"],
  WebSite: ["name", "url"],
  FAQPage: ["mainEntity"],
};

type Block = Record<string, unknown>;

function blocksIn(html: string): Block[] {
  const found: Block[] = [];
  const pattern = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;

  for (const match of html.matchAll(pattern)) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(match[1]);
    } catch (cause) {
      assert.fail(`unparseable JSON-LD: ${(cause as Error).message}`);
    }
    // A block may be a single object or an array of them; both are valid.
    for (const item of Array.isArray(parsed) ? parsed : [parsed]) {
      if (item && typeof item === "object") found.push(item as Block);
    }
  }
  return found;
}

function typeNames(block: Block): string[] {
  const type = block["@type"];
  if (typeof type === "string") return [type];
  if (Array.isArray(type)) return type.filter((t): t is string => typeof t === "string");
  return [];
}

const available = EXPECTED.filter((entry) => existsSync(join(BUILD, entry.file)));

test("the build produced the pages under test", () => {
  // Guards against the whole suite passing vacuously because the build moved.
  assert.equal(
    available.length,
    EXPECTED.length,
    `missing built HTML for: ${EXPECTED.filter((e) => !available.includes(e))
      .map((e) => e.route)
      .join(", ")} — run \`npm run build\` first`,
  );
});

for (const { route, file, types } of available) {
  const html = readFileSync(join(BUILD, file), "utf8");
  const blocks = blocksIn(html);

  test(`${route} — every JSON-LD block parses and is typed`, () => {
    assert.ok(blocks.length > 0, `no structured data on ${route}`);
    for (const block of blocks) {
      assert.ok(typeNames(block).length > 0, `a block on ${route} has no @type`);
    }
  });

  test(`${route} — carries ${types.join(", ")}`, () => {
    const present = new Set(blocks.flatMap(typeNames));
    for (const type of types) {
      assert.ok(present.has(type), `${route} is missing a ${type} block`);
    }
  });

  test(`${route} — required properties are present`, () => {
    for (const block of blocks) {
      for (const type of typeNames(block)) {
        for (const field of REQUIRED[type] ?? []) {
          assert.ok(
            block[field] !== undefined && block[field] !== null,
            `${route}: ${type} is missing "${field}"`,
          );
        }
      }
    }
  });

  test(`${route} — no duplicated top-level type`, () => {
    // Two Organization blocks is not an error, but it gives a crawler the same
    // facts twice with two chances to disagree. It happened once already.
    const counts = new Map<string, number>();
    for (const block of blocks) {
      for (const type of typeNames(block)) {
        counts.set(type, (counts.get(type) ?? 0) + 1);
      }
    }
    const duplicated = [...counts].filter(([, n]) => n > 1).map(([t]) => t);
    assert.deepEqual(duplicated, [], `${route} emits duplicates: ${duplicated.join(", ")}`);
  });
}
