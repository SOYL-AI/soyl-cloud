import { test, afterEach } from "node:test";
import assert from "node:assert/strict";

import { track } from "./analytics.ts";

type Call = [string, unknown];

/** Stands in for the browser global the Plausible snippet defines. */
function withWindow(plausible?: (...args: Call) => void) {
  (globalThis as { window?: unknown }).window = plausible ? { plausible } : {};
}

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

test("sends the event name and props in Plausible's shape", () => {
  const calls: Call[] = [];
  withWindow((...args) => calls.push(args));

  track("Contact Submitted");
  track("Calendly Interaction", { stage: "event_scheduled" });

  assert.deepEqual(calls, [
    ["Contact Submitted", undefined],
    ["Calendly Interaction", { props: { stage: "event_scheduled" } }],
  ]);
});

test("is a no-op when the script never loaded", () => {
  // An ad blocker, an unset NEXT_PUBLIC_PLAUSIBLE_DOMAIN, or a slow network.
  withWindow();

  assert.doesNotThrow(() => track("Contact Submitted"));
});

test("is a no-op on the server", () => {
  assert.doesNotThrow(() => track("Contact Submitted"));
});

test("a throwing analytics script cannot break the page", () => {
  withWindow(() => {
    throw new Error("blocked by extension");
  });

  assert.doesNotThrow(() => track("Contact Failed", { reason: "send_failed" }));
});
