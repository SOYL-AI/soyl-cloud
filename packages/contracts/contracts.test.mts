/**
 * The web/API contract check.
 *
 * `src/index.ts` is hand-written TypeScript; `schema/*.schema.json` is emitted
 * from the API's Pydantic models by `services/api/scripts/emit_schema.py`.
 * Neither can verify the other by existing, so this compares them.
 *
 * What it catches is the failure that is otherwise invisible until production:
 * a field renamed on one side. Types still compile, the API still responds, and
 * the value is `undefined` at the point where somebody renders it.
 *
 * It deliberately does not compare *types* — `string` in TypeScript against
 * `{"type": "string", "format": "uuid"}` in JSON Schema is a comparison with no
 * good answer, and one that is wrong often enough to be turned off. It compares
 * the set of field names per object, which is where drift actually happens.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

type JsonSchema = {
  $defs?: Record<string, JsonSchema>;
  properties?: Record<string, unknown>;
  required?: string[];
};

function schema(name: string): JsonSchema {
  return JSON.parse(
    readFileSync(join(here, "schema", `${name}.schema.json`), "utf8"),
  ) as JsonSchema;
}

/** Field names declared on a definition inside the emitted schema. */
function fieldsOf(root: JsonSchema, definition?: string): Set<string> {
  const node = definition ? root.$defs?.[definition] : root;
  assert.ok(node, `no definition named ${definition ?? "(root)"} in the schema`);
  return new Set(Object.keys(node.properties ?? {}));
}

/**
 * Field names in a TypeScript type alias in `src/index.ts`.
 *
 * Parsed with a regex rather than the TypeScript compiler API. That is a real
 * limitation and it is the right trade here: pulling in a parser to read a file
 * this simple would cost more than the drift it prevents, and the shapes being
 * matched are flat object literals we control. If this file grows types that
 * defeat it, replace the regex rather than deleting the test.
 */
function tsFields(source: string, typeName: string, path: string[] = []): Set<string> {
  const start = source.indexOf(`export type ${typeName} =`);
  assert.ok(start >= 0, `no exported type named ${typeName}`);

  let body = source.slice(start);
  body = body.slice(0, body.indexOf("\n};") + 3);

  for (const key of path) {
    const at = body.indexOf(`${key}:`);
    assert.ok(at >= 0, `no field ${key} on ${typeName}`);
    body = body.slice(at);
  }

  const fields = new Set<string>();
  let depth = 0;
  for (const raw of body.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("*") || line.startsWith("/")) continue;

    // Only fields at the top level of the object being read. Without this,
    // nested payload keys would be collected as if they were siblings.
    const match = depth === 1 ? line.match(/^([a-z_][a-z0-9_]*)\??:/i) : null;
    if (match) fields.add(match[1]);

    depth += (line.match(/[{]/g) ?? []).length;
    depth -= (line.match(/[}]/g) ?? []).length;
  }
  return fields;
}

const source = readFileSync(join(here, "src", "index.ts"), "utf8");

function assertSameFields(
  label: string,
  fromSchema: Set<string>,
  fromTypescript: Set<string>,
) {
  const missing = [...fromSchema].filter((f) => !fromTypescript.has(f));
  const extra = [...fromTypescript].filter((f) => !fromSchema.has(f));

  assert.deepEqual(
    missing,
    [],
    `${label}: the API sends these and TypeScript does not declare them: ${missing.join(", ")}`,
  );
  assert.deepEqual(
    extra,
    [],
    `${label}: TypeScript declares these and the API does not send them: ${extra.join(", ")}`,
  );
}

test("Envelope matches the API's schema", () => {
  assertSameFields(
    "Envelope",
    fieldsOf(schema("envelope")),
    tsFields(source, "Envelope"),
  );
});

test("SourceRef matches the API's schema", () => {
  assertSameFields(
    "SourceRef",
    fieldsOf(schema("envelope"), "SourceRef"),
    tsFields(source, "SourceRef"),
  );
});

test("every Phase 0 block type is declared on both sides", () => {
  const blocks: [string, string][] = [
    ["TextMarkdownBlock", "TextMarkdownBlock"],
    ["DocCitationBlock", "DocCitationBlock"],
    ["ListChecklistBlock", "ListChecklistBlock"],
    ["AlertCalloutBlock", "AlertCalloutBlock"],
  ];

  for (const [definition, typeName] of blocks) {
    assertSameFields(
      typeName,
      fieldsOf(schema("envelope"), definition),
      tsFields(source, typeName),
    );
  }
});

test("the four block types are exactly the ones UPDATE.md 6.3 allows", () => {
  // Adding a fifth is a real decision — a new renderer, a new validation path,
  // a new thing the model can be wrong in. It should not be possible to do it
  // by accident on one side.
  const declared = source.match(/export type BlockType =([\s\S]*?);/)?.[1] ?? "";
  const found = [...declared.matchAll(/"([a-z.]+)"/g)].map((m) => m[1]).sort();

  assert.deepEqual(found, [
    "alert.callout",
    "doc.citation",
    "list.checklist",
    "text.markdown",
  ]);
});

test("refusal is a declared outcome, not an error state", () => {
  // §9: "Refusal is a valid, well-designed outcome." If `no_evidence` ever
  // stops being in this union, the UI will start rendering it as a failure.
  const declared = source.match(/export type TurnStatus =([\s\S]*?);/)?.[1] ?? "";
  assert.ok(declared.includes('"no_evidence"'));
});
