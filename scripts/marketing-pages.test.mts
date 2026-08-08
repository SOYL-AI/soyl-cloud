import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

const routes = {
  home: readFileSync(join(ROOT, "src", "app", "page.tsx"), "utf8"),
  butler: readFileSync(join(ROOT, "src", "app", "products", "butler-ai", "page.tsx"), "utf8"),
  arip: readFileSync(join(ROOT, "src", "app", "products", "arip", "page.tsx"), "utf8"),
};

test("the redesigned marketing routes remain React Server Components", () => {
  for (const [name, source] of Object.entries(routes)) {
    assert.doesNotMatch(source, /^\s*["']use client["']/, `${name} became a client page`);
    assert.doesNotMatch(source, /from ["']framer-motion["']/, `${name} imports framer-motion`);
  }
});

test("the home hero does not restore the autoplay background video", () => {
  assert.doesNotMatch(routes.home, /<video\b/i);
  assert.doesNotMatch(routes.home, /hero-bg\.mp4/);
});

test("ARIP is consistently presented as a pilot, not a shipped product", () => {
  assert.match(routes.arip, /ARIP · Pilot program/);
  assert.match(routes.arip, /ARIP is in development/);
  assert.doesNotMatch(routes.arip, /Orchestrator is Live/i);
  assert.doesNotMatch(routes.arip, /Gross RevPAR Uplift|CAC Reduction|Chain-of-Thought Audits/i);
});

test("every primary product CTA has a real destination", () => {
  assert.match(routes.home, /href="\/book-demo"/);
  assert.match(routes.butler, /Book a walkthrough/);
  assert.match(routes.butler, /href="#workflow"/);
  assert.match(routes.arip, /href="\/contact"/);
  assert.match(routes.arip, /href="#how-it-works"/);
});

test("Butler AI FAQ content is visible as well as structured", () => {
  assert.match(routes.butler, /<details key=\{faq\.question\}/);
  assert.match(routes.butler, /<FAQSchema faqs=\{FAQS\}/);
});
