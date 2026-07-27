import { test } from "node:test";
import assert from "node:assert/strict";

import {
  HONEYPOT_FIELD,
  LIMITS,
  formatLeadEmail,
  parseContactSubmission,
} from "./contact.ts";

const valid = {
  name: "Priya Raman",
  email: "priya@grandresort.example",
  company: "The Grand Resort",
  message: "We run 84 rooms in Goa and want to see how Butler AI handles late checkout requests.",
};

test("accepts a well-formed submission and trims it", () => {
  const result = parseContactSubmission({ ...valid, name: "  Priya Raman  " });

  assert.equal(result.ok, true);
  assert.equal(result.ok && result.value.name, "Priya Raman");
  assert.equal(result.ok && result.value.email, valid.email);
});

test("a filled honeypot is spam, not a validation error", () => {
  const result = parseContactSubmission({ ...valid, [HONEYPOT_FIELD]: "http://spam.example" });

  assert.equal(result.ok, false);
  assert.equal(result.ok === false && result.spam, true);
});

test("the honeypot wins even when the rest of the submission is garbage", () => {
  // A bot that fails validation too must still get the silent path — a field
  // error list tells it exactly what to fix next time.
  const result = parseContactSubmission({ name: "", [HONEYPOT_FIELD]: "x" });

  assert.equal(result.ok === false && result.spam, true);
});

test("an empty honeypot does not mark a real submission as spam", () => {
  const result = parseContactSubmission({ ...valid, [HONEYPOT_FIELD]: "" });

  assert.equal(result.ok, true);
});

test("every missing field is reported, not just the first", () => {
  const result = parseContactSubmission({});

  assert.equal(result.ok, false);
  assert.equal(result.ok === false && result.spam, false);
  const fields =
    result.ok === false && !result.spam ? result.errors.map((error) => error.field).sort() : [];
  assert.deepEqual(fields, ["company", "email", "message", "name"]);
});

test("rejects addresses that are not addresses", () => {
  for (const email of ["not-an-email", "two@@at.example", "no@tld", "spaced out@x.example", "@x.example"]) {
    const result = parseContactSubmission({ ...valid, email });
    assert.equal(result.ok, false, `${email} should be rejected`);
  }
});

test("rejects a newline in a single-line field", () => {
  // Header injection: "Priya\nBcc: someone@else" must never reach the mailer.
  const result = parseContactSubmission({ ...valid, name: "Priya\nBcc: someone@else.example" });

  assert.equal(result.ok, false);
});

test("rejects oversized fields", () => {
  const result = parseContactSubmission({ ...valid, message: "a".repeat(LIMITS.message + 1) });

  assert.equal(result.ok, false);
});

test("rejects a message too short to be a lead", () => {
  const result = parseContactSubmission({ ...valid, message: "hi" });

  assert.equal(result.ok, false);
});

test("rejects non-object bodies", () => {
  for (const body of [null, undefined, "string", 42, []]) {
    const result = parseContactSubmission(body);
    if (Array.isArray(body)) {
      // An array is an object; it simply has no fields, so it fails validation.
      assert.equal(result.ok, false);
    } else {
      assert.equal(result.ok, false, `${String(body)} should be rejected`);
    }
  }
});

test("the lead email carries every field and quotes the message verbatim", () => {
  const { subject, text } = formatLeadEmail(valid, {
    receivedAt: new Date("2026-07-27T09:15:00.000Z"),
    source: "https://www.soyl.cloud/contact",
  });

  assert.match(subject, /Priya Raman/);
  assert.match(subject, /The Grand Resort/);
  for (const value of [valid.name, valid.email, valid.company, valid.message]) {
    assert.ok(text.includes(value), `email body is missing ${value}`);
  }
  assert.ok(text.includes("2026-07-27T09:15:00.000Z"));
});
