# Phase 0 — Revised Milestone Plan

**Date:** 2026-07-26
**Supersedes:** `Update.md` §12, and the parts of §5 and §10 noted below.
**Assumes:** [ADR-001](ADR-001-repo-structure.md) is approved (web app stays at repo root; `packages/contracts` as an npm workspace; `services/api` + `services/worker` added top-level; web on Vercel, services on Railway).

**Estimating basis.** `Update.md` §12 budgets 7–8 weeks for **two engineers**. This plan is stated in the same unit — **engineer-weeks for two engineers working in parallel** — so the totals are comparable. If Phase 0 is actually staffed by one engineer, multiply elapsed time by roughly 1.8 (not 2.0 — some of this is serial regardless of headcount). **Confirming headcount is Decision 4 in [RISKS.md](RISKS.md).**

---

## Summary of changes to the milestone plan

| Milestone | Brief | Revised | Δ |
|---|---|---|---|
| **M0 — Stabilise the live site** | *(not in brief)* | **0.5 wk** | **new** |
| M1 — Foundation | 1 wk | **1 wk** | — |
| M2 — Auth and tenancy | 1 wk | **1.5 wk** | +0.5 |
| M3 — Ingestion | 1.5 wk | **2 wk** | +0.5 |
| M4 — Retrieval and answers | 2 wk | **2 wk** | — |
| M5 — Marketing site and SEO | 1 wk | **1.5 wk** | +0.5 |
| M6 — Admin panel | 1 wk | **1 wk** | — |
| **Total** | **7–8 wk** | **9.5 wk** | **+1.5–2.5** |

The increase is not padding. It is: work the brief did not know about because it assumed an empty repo (M0), a heavier-than-budgeted auth surface (M2), an OCR vendor integration the brief mentions in one clause but does not budget (M3), and the fact that M5 is a **repositioning of an existing 41-page site**, not a greenfield build (M5).

---

## M0 — Stabilise the live site *(new — 0.5 week)*

Not in the brief, because the brief assumed there was no site. Everything here is small, independent of Phase 0 architecture, and either protects revenue or removes a foot-gun before we start committing application code. **This is also the milestone that pays for itself immediately.**

| # | Task | File | Why now |
|---|---|---|---|
| 1 | **Wire up the contact form** | [src/app/contact/page.tsx:14-23](src/app/contact/page.tsx#L14-L23) | It fakes success with a `setTimeout` and discards the submission. **Leads are being lost right now.** Needs a real destination — Decision 5. |
| 2 | **Shrink the favicon** | [src/app/icon.png](src/app/icon.png) | 279 KB, served on every page, the single heaviest request on mobile. Resize to 32/180/512 px variants. Biggest perf win in the repo for ten minutes' work. |
| 3 | **Fix the missing `<h1>`s** | [src/components/ui/SectionHeader.tsx:40](src/components/ui/SectionHeader.tsx#L40) | Add an `as` prop; set `as="h1"` on `/faq`, `/security`, `/company`, `/compare`, `/blog`. Five routes currently have no `h1`. |
| 4 | **Resolve the canonical host** | [src/lib/constants.ts:3](src/lib/constants.ts#L3) | Canonicals, sitemap and robots all point at the apex, which 308s to www. **Blocked on Decision 1.** |
| 5 | **Bump `next` 16.2.9 → 16.2.12** | `package.json` | Clears 3 high-severity `sharp`/`libvips` + `postcss` CVEs. Patch bump, same minor. |
| 6 | **Close the type-check escape hatch** | [next.config.ts](next.config.ts) | Delete the dead `eslint` key (removed in Next 16, currently warns and does nothing) and `typescript.ignoreBuildErrors`. Source is already clean — verified with `tsc --noEmit`. Costs nothing now; blocks a whole class of bugs later. |
| 7 | Housekeeping | — | `git rm lint_output.txt`; add `.gitattributes` (`* text=auto eol=lf`); rename assets with spaces/trailing spaces; fix the duplicate `BrowserMockup` component. |
| 8 | Fix the legal-page date | [src/app/privacy/page.tsx:13](src/app/privacy/page.tsx#L13) | `new Date().toLocaleDateString()` silently changes on every deploy. A legal document needs a fixed revision date. |

**Accepted when:** a submission to `/contact` arrives at a real inbox and is verified end to end; mobile Lighthouse on `/` improves measurably from the 71 baseline; all 15 sampled routes have exactly one `h1`; `npm audit --omit=dev` is clean; `next build` passes **with type checking enabled**; `git status` is clean apart from the pre-existing blog work.

> **Note:** tasks 1 and 4 are blocked on founder decisions. Tasks 2, 3, 5, 6, 7, 8 are not and can start immediately.

---

## M1 — Foundation *(1 week — unchanged)*

**What changes from the brief:** no monorepo migration (ADR-001), so the time the brief allocated to scaffolding goes into CI instead — which this repo has none of.

**Build:**

```
.github/workflows/ci.yml     lint · typecheck · test · build · gitleaks · Lighthouse budgets
docker-compose.yml           Postgres 16 + pgvector, Redis 7, MinIO (S3-compatible)
Makefile                     make setup · make dev · make test · make migrate
package.json                 add "workspaces": ["packages/*"]
packages/contracts/          Pydantic → Zod + TS generation target
services/api/                FastAPI skeleton, uv, ruff, mypy --strict, import-linter
services/worker/             ARQ skeleton
services/api/alembic/versions/001_*.py   core.* tables, RLS enabled AND forced
.vercelignore                exclude services/ and packages/ from Vercel build context
```

**Deviations from the brief, all from [ADR-001](ADR-001-repo-structure.md):**
- npm workspaces, not pnpm + Turborepo.
- Railway environments for **API and worker only** — the web app stays on Vercel with its existing project and Root Directory untouched.
- CI runs `eslint` directly. `next lint` was **removed in Next 16**; `package.json` already scripts `"lint": "eslint"`, so this is already correct.

**Non-negotiables landed here:** RLS in migration 001 (`Update.md` §6.1), tenant isolation test suite in CI (§6.2).

**RLS detail the brief is right about but which constrains hosting:** §6.1 requires `FORCE ROW LEVEL SECURITY` (correct — a table *owner* bypasses plain RLS) and an application role without `BYPASSRLS`, plus a separate migration role. **This requires a Postgres provider that grants `CREATEROLE`.** Some managed platforms hand you a single near-superuser and nothing else. This is a hard selection criterion, not a preference — see [RISKS.md](RISKS.md) §3.

**Accepted when:** `git clone` → running local stack in under 30 minutes on a clean machine; the tenant isolation suite passes against at least one real table and **fails** when RLS is deliberately disabled (prove the test can detect the thing it exists to detect); CI is green and blocking on `main`.

---

## M2 — Auth and tenancy *(1 week → 1.5 weeks)*

```
src/proxy.ts                          session gate — NOT middleware.ts (renamed in Next 16)
src/app/api/auth/[...nextauth]/route.ts
src/app/(app)/                        new authenticated route group
src/app/(marketing)/                  existing routes moved here — URLs unchanged
src/lib/auth/                         session → short-lived signed JWT for the API (§23.1)
services/api/soyl/identity/           Principal, TenantContext, RLS session var per request
```

**Why +0.5 week:**

1. **`middleware.ts` is `proxy.ts` in Next 16.** Confirmed in the bundled docs (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`). Every Auth.js/NextAuth integration guide written for Next 14/15 references `middleware.ts`. Also note the docs' warning: *"Proxy is meant to be invoked separately of your render code… you should not attempt relying on shared modules or globals."* Session logic must be structured accordingly, and Next's own auth guide treats proxy checks as **optimistic only**, with the real authorization in a Data Access Layer.
2. **Auth.js on Next 16 needs verification before it is committed to.** Next 16's own auth guide lists NextAuth among compatible libraries, but Auth.js v5 + Next 16 + `proxy.ts` is a combination I have not verified running. **First task of M2 is a one-day spike**; if it fights us, Better Auth is the fallback and is also on Next's list. Flagging now rather than discovering it mid-milestone.
3. Moving existing routes into a `(marketing)` route group is mechanical but touches all 15 route directories and must be verified to change zero URLs.

**Accepted when:** two tenants each with a property exist, and an automated test proves neither can read the other's rows **through any API route**; `audit.log` records every auth event; **and every existing marketing URL still returns 200 with an unchanged canonical** (regression gate for the route-group move).

---

## M3 — Ingestion *(1.5 weeks → 2 weeks)*

```
services/worker/soyl/rag/extract.py     pymupdf + OCR fallback
services/worker/soyl/rag/chunk.py       structure-first, heading paths, never split a table
services/worker/soyl/rag/enrich.py      context headers + 2–4 hypothetical questions
services/worker/soyl/rag/embed.py
services/api/soyl/rag/storage.py        StoragePort — the one early abstraction (§5)
src/app/(app)/documents/                upload UI, status, retry
```

**Why +0.5 week:** the brief's §8 says *"Scanned or layout-complex documents through a layout-aware OCR service"* in a single clause and budgets nothing for it. In practice that is a **third-party vendor**: selection, API integration, cost modelling, failure handling, and a data-processing agreement — because hotel documents will pass through it. That is not a clause, it is several days. **Decision 6.**

**Hard dependency:** M3's acceptance criterion requires *"a 40-page PDF SOP"*. We do not have one. **Pilot hotel documents are on the critical path from here onward** — see [RISKS.md](RISKS.md) §2.

**Hard blocker:** `Update.md` §10 states legal pages are *"required before any customer uploads a document. Not optional."* The current [/privacy](src/app/privacy/page.tsx) is ~350 words of generic boilerplate describing a brochure site; there is **no DPA at all**. M3 is where real customer documents first enter the system. **The legal pages must be done before M3 completes, and they are a lawyer's lead time, not ours.** Start now.

**Accepted when:** a 40-page PDF SOP is queryable within two minutes of upload; chunks carry correct heading paths; a table survives chunking intact; a deliberately corrupt file fails with a readable error and a retry path, not a stack trace.

---

## M4 — Retrieval and answers *(2 weeks — unchanged)*

```
services/api/soyl/rag/retrieve.py      hybrid: vector + Postgres FTS + question index, RRF k=60
services/api/soyl/rag/rerank.py        cross-encoder, 30 in → 8 out, threshold, may return zero
services/api/soyl/ai/pipeline.py       guard → understand → retrieve → synthesise → validate → persist → stream
packages/contracts/                    envelope: text.markdown, doc.citation, list.checklist, alert.callout
src/app/(app)/ask/                     streaming UI, citations, source drawer
```

**One architectural correction to the brief.** `Update.md` §6.7 requires `no-store, no-transform` on every streaming response and warns *"a proxy that buffers the stream destroys the experience."* Correct — and it has a specific consequence here: **the SSE stream must go from the Python API on Railway directly to the browser, not proxied through a Vercel function.** Routing it through Next.js on Vercel puts a serverless function with a maximum invocation duration in the middle of a long-lived stream. Answers that outlive that limit are truncated. The Next.js app should mint the short-lived JWT (§23.1) and hand the browser a direct API endpoint; only non-streaming calls go through the BFF.

**Hard dependency:** acceptance requires *"40 hand-labelled question/chunk pairs built from real pilot documents"* with recall@10 ≥ 0.85 and precision@5 ≥ 0.70. **This cannot be built, let alone accepted, without pilot documents.** Labelling 40 pairs is also roughly a day of *founder* time, not engineering time — someone who knows hotel operations must judge relevance. Budget it explicitly.

**Accepted when:** recall@10 ≥ 0.85 and precision@5 ≥ 0.70 on that set; every answer carries working citations that open the source excerpt; and questions genuinely outside the corpus produce an honest "I don't have that." Per the brief: **test the last one deliberately and often.**

---

## M5 — Marketing site and SEO *(1 week → 1.5 weeks)*

**This is the milestone the brief gets most wrong, because it assumes there is no marketing site.**

`Update.md` §4 scopes M5 as *"New landing page, product page, pricing placeholder, about, blog/resources scaffold."* All of that **already exists**, at higher quality than "scaffold": 41 prerendered pages, generated sitemap and robots, per-page canonicals, extensive JSON-LD, 7 published articles, 16 competitor comparison pages, desktop Lighthouse 100 SEO.

M5 is therefore **not a build**. It is three things:

**(a) Close the real gaps** *(the brief is right that these are missing)*
- `/dpa` — does not exist. Blocking for M3.
- Rewrite `/privacy` and `/terms` for a product that stores customer documents and sends content to a model provider: sub-processors, data residency, retention, deletion, model-provider zero-retention.
- Analytics — **nothing is installed today**, so signup-funnel instrumentation and `analytics.event` capture start from zero.
- Generated per-page OG images (currently one static `og-image.png` for the whole site).

**(b) Fix what M0 could not**
- Mobile performance. **This is the criterion at risk.** M5 demands "≥ 90 performance for every marketing route"; the measured mobile baseline for `/` is **71 with a 5.6 s LCP**. The cause is structural: 25 files are `"use client"` — including nearly every `page.tsx` — plus **two animation libraries** (`framer-motion` *and* `gsap`). Getting to 90 on mobile means converting marketing pages to Server Components and dropping one animation library. That is real work, and it directly implements §10's "Marketing routes are RSC" requirement, which the site currently violates.
- Mobile a11y 89 → `button-name`, `color-contrast`, `heading-order`.
- Security headers (CSP, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`; add `includeSubDomains` to HSTS) — now mandatory, because from M2 the domain carries authenticated sessions.

**(c) Reposition — pending Decision 2**

The site currently sells Butler AI (guest-facing concierge), PMS Lite (property management with OTA integrations and ADR/RevPAR analytics) and SOYL Dine (restaurant POS). Phase 0 builds an internal-facing, document-grounded advisor for hotel *owners*. `Update.md` §4 puts PMS integrations and ADR/RevPAR computation **explicitly out of scope** — both currently advertised on `/products/pms-lite`.

**How much of M5 is rewriting versus adding depends entirely on Decision 2, and the 1.5-week estimate assumes "add a new product page, leave the existing three."** If Phase 0 replaces the current positioning, M5 grows by at least a week and 16 comparison pages need reconsidering.

**Two brief corrections on URLs — both would cost SEO if followed literally:**

| Brief says | Repo has | Recommendation |
|---|---|---|
| `/resources/*` (§10) | `/blog` + `/blog/[slug]`, 7 posts, in the sitemap, internally linked | **Keep `/blog`.** Moving indexed URLs to `/resources/*` needs 301s and discards accumulated signal for a naming preference. |
| `/legal/privacy`, `/legal/terms`, `/legal/dpa` (§10) | `/privacy`, `/terms` — indexed, in sitemap, linked from the footer | **Keep the existing paths; add `/dpa`.** Same reasoning. |

Also: §12's M5 requires *"first three resource articles published."* **Seven are already published**, with an eighth in the working tree. Criterion already met — replace it with something meaningful, e.g. three articles targeting the *owner-advisor* positioning.

**Accepted when:** Lighthouse **mobile** ≥ 90 perf / ≥ 95 SEO on every marketing route in CI (mobile, not desktop — desktop already passes and would be a vanity gate); structured data validates; sitemap submitted to Search Console under the agreed canonical host; `/privacy`, `/terms`, `/dpa` reviewed by a lawyer; signup funnel emitting `analytics.event` rows end to end.

---

## M6 — Admin panel *(1 week — unchanged)*

```
src/app/(admin)/tenants|questions|answers/[turnId]|documents|funnel|cost/
```

All six screens from `Update.md` §11. `robots.ts` already disallows `/admin/` and `/api/` — [src/app/robots.ts:9](src/app/robots.ts#L9). Nothing to change there.

**Accepted when:** you can take any answer the system gave, open it in the inspector, and explain in under a minute why it said what it said.

**If running over:** the brief's own guidance is right — cut to the questions list and the answer inspector.

---

# Everything in `Update.md` that is wrong, unnecessary, or impossible

Listed because the brief asked for it explicitly, and because working around a bad instruction quietly is worse than saying so.

## Factually wrong given this repo

| § | Says | Actually |
|---|---|---|
| **§2** | *"This is a greenfield build."* | 137 tracked files, 24 commits, 41 live pages, real domain, real traffic. The premise of the section is void. |
| **§5** | *"Next.js 15 App Router"* | Repo is on **16.2.9**. Ahead of the brief, not behind — but Next 16 has breaking changes the brief predates: `middleware`→`proxy`, `next lint` removed, `eslint` config key removed, async request APIs, async `params` for `sitemap`/`icon`/`opengraph-image`, Turbopack by default. |
| **§5** | *"shadcn/ui"* | Not installed. There is a hand-rolled kit in [src/components/ui/](src/components/ui/) used by all 41 pages. Adding shadcn now means **two design systems**. Recommend extending the existing kit. |
| **§5** | *"Motion"* | Repo has **both** `framer-motion` and `gsap` + `@gsap/react`. Consolidation is an M5 perf task, not a given. |
| **§4 / §12 M5** | *"New landing page, product page, pricing placeholder, about, blog/resources scaffold"* | All exist, richer than described. M5 is a fix-and-reposition, not a build. |
| **§12 M5** | *"first three resource articles published"* | **Seven** are published; an eighth is in the working tree. Criterion already satisfied. |
| **§10** | *"One hostname, https, no `www`/non-`www` split"* | Correct as a principle, but production **is** `www` and the code says apex — every canonical and sitemap URL 308-redirects. The brief's stated preference ("no www") is the *opposite* of what production serves, so following it literally means changing the canonical host of an indexed live site. **Decision 1.** |
| **§12 M1** | *"Railway environments for staging and production"* | The web app is on Vercel and should stay ([ADR-001](ADR-001-repo-structure.md)). Railway covers API + worker only. |
| **§5** | *"Deploy — Railway. Web, API and worker as three services."* | Moving the live site off Vercel discards the edge CDN and `/_next/image` transform that currently produce the good LCP (790 KB PNG → 36 KB). A measured regression for no benefit. |

## Would actively cost us if followed literally

| § | Instruction | Problem |
|---|---|---|
| **§10** | `/resources/*` | `/blog/*` is indexed with 7 posts. Renaming discards signal and needs 301s. Keep `/blog`. |
| **§10** | `/legal/privacy`, `/legal/terms`, `/legal/dpa` | `/privacy` and `/terms` are indexed and footer-linked. Keep paths; add `/dpa`. |
| **§5** | pnpm + Turborepo + `apps/web` | See [ADR-001](ADR-001-repo-structure.md). Four simultaneous changes to a live deploy with no CI, no tests and no analytics to detect breakage. |
| **§6.7** | `no-store, no-transform` + HTTP/2 at the edge | Right requirement; the brief doesn't draw the consequence. **SSE must bypass Vercel functions** and stream Railway→browser directly, or invocation limits truncate long answers. |

## Underspecified — hides real work

| § | Gap |
|---|---|
| **§8** | *"a layout-aware OCR service"* — one clause, zero budget. It is a vendor selection, an integration, a cost model, and a DPA. Roughly +0.5 week. **Decision 6.** |
| **§5** | *"Auth.js (NextAuth)"* — needs verifying against Next 16 + `proxy.ts` before commitment. One-day spike at the top of M2. |
| **§6.1** | *"a role without `BYPASSRLS`"* and *"migrations use a separate role"* — requires a Postgres provider granting `CREATEROLE`. A **hosting selection criterion**, not a code detail. |
| **§12 M4** | *"40 hand-labelled question/chunk pairs"* — labelling requires hotel-operations judgement. That is **founder time (~1 day)**, not engineering time, and it is on the critical path. |
| **§12** | *"7–8 weeks for two engineers"* — headcount unconfirmed. At one engineer this is ~17 weeks elapsed, not 9.5. **Decision 4.** |

## Missing entirely

1. **The contact form is broken and silently discarding leads.** Not the brief's fault — it didn't know the site existed — but it is the most urgent item in this document.
2. **No analytics exists.** §10 assumes instrumenting a funnel; there is no baseline and no way to detect if a change hurts traffic.
3. **No CI, no tests.** §13 lists seven blocking CI gates against a repo with zero workflows.
4. **The positioning conflict** between the live product line and Phase 0's product (§10 and §4 pull in different directions). **Decision 2.**
5. **`typescript.ignoreBuildErrors: true`** — §13 mandates blocking `tsc --noEmit`; the repo currently ships type errors by configuration.

## One tension worth naming, not a defect

**§6.5** requires every question logged *"permanently"*. **§10** requires a GDPR-shaped privacy policy, and the company is Bengaluru-based, so India's DPDP Act applies alongside GDPR for any EU customers. "Permanently" and a data-subject erasure request are in direct tension. Resolve it in the privacy policy and DPA — most likely by pseudonymising the question log at the tenant/user boundary (which §6.8's PII minimisation already half-implies) rather than by weakening the log. **Worth deciding before the lawyer drafts, not after.**
