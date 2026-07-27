import { test } from "node:test";
import assert from "node:assert/strict";

import { readHeadings } from "./headings.mjs";

type Page = { route: string; levels: number[]; h1: string[] };

const pages: Page[] = readHeadings();

test("the build produced routes to check", () => {
  assert.ok(pages.length > 30, `only ${pages.length} prerendered routes found`);
});

test("every route has exactly one <h1>", () => {
  const offenders = pages
    .filter((page) => page.h1.length !== 1)
    .map((page) => `${page.route} has ${page.h1.length}`);

  assert.deepEqual(
    offenders,
    [],
    `routes without exactly one <h1>:\n  ${offenders.join("\n  ")}`,
  );
});

// The five routes that shipped with no <h1> at all. Named explicitly so that a
// regression points at the route rather than at a count.
for (const route of ["/blog", "/compare", "/faq", "/company", "/security"]) {
  test(`${route} has an <h1>`, () => {
    const page = pages.find((candidate) => candidate.route === route);
    assert.ok(page, `${route} was not prerendered`);
    assert.equal(page.h1.length, 1, `${route} has ${page.h1.length} <h1> elements`);
    assert.ok(page.h1[0].length > 0, `${route} has an empty <h1>`);
  });
}

test("the <h1> is the first heading on the page", () => {
  const offenders = pages
    .filter((page) => page.levels.length > 0 && page.levels[0] !== 1)
    .map((page) => `${page.route} starts at h${page.levels[0]}`);

  assert.deepEqual(offenders, [], `routes whose first heading is not the <h1>:\n  ${offenders.join("\n  ")}`);
});
