import { test, afterEach } from "node:test";
import assert from "node:assert/strict";

import { persistLead, readLeadApiConfig } from "./leads.ts";

const lead = {
  name: "Priya Raman",
  email: "priya@grandresort.example",
  company: "The Grand Resort",
  message: "We run 84 rooms in Goa and want a demo.",
  source_url: "https://www.soyl.cloud/contact",
};

const config = { baseUrl: "https://api.soyl.test", token: "token" };

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

test("config is null unless both variables are present", () => {
  assert.equal(readLeadApiConfig({ API_BASE_URL: "https://api.soyl.test" }), null);
  assert.equal(readLeadApiConfig({ LEAD_INGEST_TOKEN: "t" }), null);
  assert.equal(readLeadApiConfig({}), null);
});

test("a trailing slash on the base URL does not produce a double slash", () => {
  const parsed = readLeadApiConfig({
    API_BASE_URL: "https://api.soyl.test///",
    LEAD_INGEST_TOKEN: "t",
  });

  assert.equal(parsed?.baseUrl, "https://api.soyl.test");
});

test("posts the lead as JSON with the bearer token", async () => {
  let seen: { url: string; init: RequestInit } | null = null;
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    seen = { url, init };
    return new Response(JSON.stringify({ id: "lead-1", created_at: "2026-07-27T00:00:00Z" }), {
      status: 201,
    });
  }) as unknown as typeof fetch;

  const result = await persistLead(lead, config);

  assert.deepEqual(result, { persisted: true, id: "lead-1" });
  assert.equal(seen!.url, "https://api.soyl.test/v1/leads");
  assert.equal((seen!.init.headers as Record<string, string>).Authorization, "Bearer token");
  assert.deepEqual(JSON.parse(seen!.init.body as string), lead);
});

test("an API error is reported, never thrown", async () => {
  // The email has already been delivered by the time this runs. Throwing here
  // would turn a delivered lead into a 502 for the visitor.
  globalThis.fetch = (async () => new Response("nope", { status: 500 })) as typeof fetch;

  const result = await persistLead(lead, config);

  assert.deepEqual(result, { persisted: false, reason: "http_500" });
});

test("an unreachable API is reported, never thrown", async () => {
  globalThis.fetch = (async () => {
    throw new TypeError("fetch failed");
  }) as unknown as typeof fetch;

  assert.deepEqual(await persistLead(lead, config), { persisted: false, reason: "unreachable" });
});

test("a timeout is distinguishable from a refusal", async () => {
  globalThis.fetch = (async () => {
    const error = new Error("timed out");
    error.name = "TimeoutError";
    throw error;
  }) as unknown as typeof fetch;

  assert.deepEqual(await persistLead(lead, config), { persisted: false, reason: "timeout" });
});

test("a success with an unreadable body is still a success", async () => {
  // The row exists. Not being able to parse the id back does not change that.
  globalThis.fetch = (async () => new Response("not json", { status: 201 })) as typeof fetch;

  assert.deepEqual(await persistLead(lead, config), { persisted: true, id: "" });
});
