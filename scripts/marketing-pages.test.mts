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
const typewriter = readFileSync(join(ROOT, "src", "components", "ui", "TypewriterText.tsx"), "utf8");
const heroPhone = readFileSync(join(ROOT, "src", "components", "mockups", "InteractiveHeroGuestPortal.tsx"), "utf8");

test("the redesigned marketing routes remain React Server Components", () => {
  for (const [name, source] of Object.entries(routes)) {
    assert.doesNotMatch(source, /^\s*["']use client["']/, `${name} became a client page`);
    assert.doesNotMatch(source, /from ["']framer-motion["']/, `${name} imports framer-motion`);
  }
});

test("the restored home video is silent, inline, looped, and has a still-image fallback", () => {
  assert.match(routes.home, /<video\b/i);
  assert.match(routes.home, /autoPlay/);
  assert.match(routes.home, /muted/);
  assert.match(routes.home, /playsInline/);
  assert.match(routes.home, /loop/);
  assert.match(routes.home, /preload="metadata"/);
  assert.match(routes.home, /poster="\/images\/hero_lobby\.png"/);
  assert.match(routes.home, /hero-bg\.mp4/);
});

test("the home hero restores rotating copy without restoring framer-motion", () => {
  assert.match(routes.home, /<TypewriterText/);
  assert.match(routes.home, /answers every guest\./);
  assert.match(routes.home, /routes every request\./);
  assert.match(routes.home, /keeps every team in sync\./);
  assert.doesNotMatch(typewriter, /framer-motion/);
  assert.match(typewriter, /prefers-reduced-motion: reduce/);
});

test("landing and Butler heroes both show the current interactive phone experience", () => {
  assert.match(routes.home, /<InteractiveHeroGuestPortal/);
  assert.match(routes.butler, /<InteractiveHeroGuestPortal/);
  assert.match(routes.butler, /Butler AI new OPs console \.png/);
  assert.doesNotMatch(heroPhone, /images\.unsplash\.com/);
});

test("the landing product mockup keeps the phone above the desktop console", () => {
  assert.match(routes.home, /relative isolate order-2 min-h-\[620px\]/);
  assert.match(routes.home, /top-12 z-0/);
  assert.match(routes.home, /bottom-0 right-0 z-20/);
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
