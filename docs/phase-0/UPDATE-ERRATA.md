# What `UPDATE.md` gets wrong

Owed since the orientation session (`DECISIONS.md` §5, "Still owed"). Every item here is checked against the code as it actually is, not against the audit's summary of it.

First, the thing that is not wrong: **all 19 handbook cross-references in `UPDATE.md` resolve.** §16, §17.4, §21, §23.1, §24.2, §27.3, §28.3, §33.4, §34.3, §35, §38.2, §43.1, §43.2, §45.1, §45.3, §48.7, §58.5, §62.1 and §10.3 all exist in `docs/architecture/`. The brief is not internally incoherent. It is wrong about facts on the ground, which is exactly what you would expect from a document written before anyone looked at the repository.

Items are ordered by what they cost if followed literally.

---

## A. The two that cost us SEO

### A1. §10 — "Canonical URLs. One hostname, `https`, no `www`/non-`www` split."

**What it costs.** "No `www`" reads as an instruction to canonicalise on the apex. Production serves `www.soyl.cloud`; the apex 308-redirects to it. Following the instruction literally means every canonical, every `<loc>` in the sitemap and the `robots.txt` sitemap directive point at a hostname that immediately redirects away — which is the live defect the audit found and M0 fixed, re-introduced deliberately.

The alternative reading — move production to the apex — is worse: it changes the hostname of every already-indexed URL on a domain that is nine months old, for no benefit.

**Correct instruction.** *One hostname, `https`, and it is `www.soyl.cloud`, because that is what production serves.* Ruled this way in `DECISIONS.md` §5 and implemented in `975b806`. The rule the brief was reaching for is real — pick one host and never contradict it — it just picked the wrong one.

### A2. §4 and §10 — the URL structure quietly relocates every indexed page

§10 specifies `/resources/*` as "the SEO engine", and `/legal/privacy`, `/legal/terms`, `/legal/dpa` for legal pages. §12's M5 says "first three resource articles published".

**What it costs.** The site already has `/blog` with 7 articles and `/compare/*` with 16 comparison pages — the deliberate SEO play — plus `/privacy` and `/terms`. Taken literally the brief moves `/blog/*` to `/resources/*` and `/privacy` to `/legal/privacy`. Every one of those URLs is indexed. **The brief says nothing about redirects anywhere**, so the literal execution is: publish at new paths, let the old ones 404, and discard the accumulated signal on a young domain. `/compare/*` isn't mentioned at all, so a literal reading of "New landing page, product page, pricing placeholder, about, blog/resources scaffold" (§4) also risks it simply not being carried over.

**Correct instruction.** *Keep `/blog` and `/compare` where they are. Add `/legal/dpa` alongside the existing `/privacy` and `/terms`. If any URL must move, ship a permanent redirect in the same commit.* The naming is a preference; the indexed URLs are an asset.

---

## B. Wrong about the starting position

### B1. §2 — "a marketing site only… This is a greenfield build."

Half true, and the half that is false is the expensive half. There is no backend, no auth, no database — genuinely greenfield. But the marketing site is 41 prerendered pages with generated `sitemap.ts` and `robots.ts`, per-page canonicals on every route, `Organization`/`WebSite`/`FAQPage`/`BreadcrumbList`/`SoftwareApplication` JSON-LD, OG and Twitter cards, 7 articles and 16 comparison pages, scoring 100 on SEO and 96–100 desktop performance. Treating it as greenfield means rebuilding assets that already work.

### B2. §1 — "You are working with a team of two to three people."

One engineer. Corrected in `DECISIONS.md` §2, but note that **every estimate in §12 inherits the error**, including the closing "roughly 7–8 weeks for two engineers." Revised to 12–14 weeks.

### B3. §5 — "Next.js 15 App Router"

The repo is on **16.2.9**. Following the brief is a downgrade. Next 16 also removed `next lint` and the `eslint` key in `next.config.ts`, which is why CI runs `eslint` directly.

### B4. §5 — "shadcn/ui"

Not present, and not a gap. The site has hand-rolled primitives (`Button`, `Badge`, `Container`, `SectionHeader`, `AnimatedCounter`) and a coherent visual language built on CSS custom properties. Adding shadcn now means running two design systems through the authenticated product.

### B5. §5 — "Motion", singular

The repo ships `framer-motion` **and** `gsap` + `@gsap/react`. Not a stack decision to make — a consolidation to do, in M5, keeping whichever is doing more work.

### B6. §5 — "Monorepo — pnpm + Turborepo" and "Deploy — Railway", for web

Superseded by ADR-001 and `DECISIONS.md` §1: npm workspaces, build in place, web stays on Vercel, API and worker to Railway. Worth restating why the deploy half matters: Vercel's edge cache and image transform serve a 790 KB hero as 36 KB from Mumbai. Moving web to Railway regresses every number in `BASELINE.md` and there is nothing to gain.

---

## C. Wrong about what the work is

### C1. §12 M5 — scoped as a build, but it is a performance job

`DECISIONS.md` §5 already accepted this. Adding the measurements: **SEO is already 100 on every route sampled, desktop performance is 96–100, and CLS is 0 everywhere.** Three of M5's four acceptance numbers are met today. The one that isn't is mobile performance — 57–86 against a bar of 90, with LCP 3.7–16.8 s against a bar of 2.0 s. M5 is one problem, not six.

### C2. §10 — "Core Web Vitals … verified in Lighthouse CI on every PR", from the start

The goal is right and the timing is wrong. A performance gate on a CI pipeline one day old, against a site where no mobile route currently passes, fails every PR from the first one — which teaches everyone to ignore CI. `BASELINE.md` records the numbers now and M5 adds the gate once there is something worth defending.

### C3. §13 — "`tsc --noEmit` … all in CI, all blocking"

Superseded by `DECISIONS.md` §5's sequencing: M0 reports non-blocking, M1 fixes and enforces. Implemented that way. Flagged only so the two documents are not read as contradicting each other.

### C4. §12 M1 — "Monorepo, CI (lint, typecheck, test, build)"

CI, a test runner and the build gate are done, in M0. M1 inherits Docker Compose, the local stack, Railway environments and migration 001 — a smaller milestone than the brief describes.

---

## D. Contradictions the brief does not acknowledge

### D1. The live site sells a different product from the one Phase 0 builds

The site markets three shipped-sounding products — Butler AI (guest-facing concierge), PMS Lite (property management with OTA integrations and ADR/RevPAR analytics), SOYL Dine (restaurant POS) — with 16 comparison pages positioning Butler AI against guest-messaging vendors.

Phase 0 builds an internal-facing, document-grounded advisor for hotel **owners**. And §4 puts "PMS, booking engine, accounting or any external integrations" and "occupancy/ADR/RevPAR computation" explicitly out of scope — **both of which `/products/pms-lite` advertises today as features.**

So §3's "land on soyl.cloud, understand in under ten seconds what this is, and sign up" cannot be satisfied without deciding what the site says the company sells. That is a positioning call, not an engineering one, and it determines how much of M5 is a rewrite. Still open — it is Decision 2 in `RISKS.md`.

### D2. §10 — "No third-party trackers before the privacy policy is live"

Read literally this blocks analytics until the lawyer finishes, which `DECISIONS.md` §3 overrides by moving analytics into M0. The override is right — Plausible sets no cookies and collects no personal data, so it is not the thing that clause is protecting against.

But it leaves a real gap: **`/privacy` currently does not mention analytics at all.** It needs one sentence naming Plausible and its role, and that sentence should go in whether or not the lawyer has started. Left undone here because M0 bars content changes — flagging it as the smallest legal item on the list.

### D3. §6.8 has gone missing from `AGENTS.md`

`UPDATE.md` §6 lists eight non-negotiables ending with **"PII minimisation before inference"** — guest names, emails and phone numbers stripped or pseudonymised before any content reaches a model.

`AGENTS.md`, under a heading that says "From `UPDATE.md` §6", lists eight items ending with **"No provider SDK imported outside the provider adapter layer"** instead. That rule is real, but it comes from §5, and it has displaced PII minimisation.

`DECISIONS.md` §2 says "Nothing comes out of `UPDATE.md` §6." Since `AGENTS.md` is the file that loads into every session and `UPDATE.md` is the one nobody re-reads, this is how a non-negotiable disappears quietly. **`AGENTS.md` should list nine, not eight.** Not fixed here — it is your file and the correction is yours to make.

---

## E. Smaller, mostly fine

| § | Item | Note |
|---|---|---|
| §10 | "All images through `next/image`" | Already true everywhere |
| §10 | "one `h1` per page" | Was false on 5 routes; fixed in M0 (`2895b0c`) |
| §10 | "`hreflang` only if we ship a second language" | Correctly absent. Nothing to do |
| §10 | "sitemap.xml and robots.txt generated, not hand-maintained" | Already true |
| §5 | "Argon2id for password hashing" | Auth.js doesn't do this itself; we implement it. Fine, just not free |
| §7 | `analytics.event` in Postgres | Consistent with §4's exclusion of ClickHouse. No conflict |
| §12 | Milestone numbering | M0 did not exist when the brief was written, so "M1" in §12 and "M1" in conversation now mean different things. Worth one clarifying line in `UPDATE.md` |
