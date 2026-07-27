# Phase 0 — Risks, Dependencies and Constraints

**Date:** 2026-07-26
**Related:** [REPO-AUDIT.md](REPO-AUDIT.md) · [ADR-001](ADR-001-repo-structure.md) · [PHASE-0-PLAN.md](PHASE-0-PLAN.md)

---

## 0. The blocker to raise first: the architecture handbook is not in this repo

The kickoff brief says to read `docs/architecture/SOYL-AI-Hotel-Operating-System-Architecture-Handbook.docx`. **There is no `docs/` directory in this repository** — I created `docs/phase-0/` to hold these four documents. The handbook has never been committed; it does not appear anywhere in the 24-commit history.

This matters more than it might seem. `Update.md` defers to the handbook by section number **nineteen times**, for load-bearing detail:

> §16, §17.4 (Response Envelope) · §21 (API layering) · §23.1 (session→JWT exchange) · §24.2 (SSE) · §27.3 (answer inspector) · §28.3 (isolation tests) · §33.4 (provenance) · §34.3 (usage ledger) · §35 (provider abstraction) · §38.2 (prompt fencing) · §43.1, §43.2 (chunking, hypothetical questions) · §45.1, §45.3 (hybrid retrieval, reranking) · §48.7 (RLS) · §58.5 (PII minimisation) · §62.1 (settings) · Part VII (RAG, "follow in full")

I can build sensible versions of all of these from first principles, and this plan assumes I will. But **they will not match the handbook**, and the Response Envelope in particular is a schema we are told never to change casually once answers start flowing. Rediscovering in Phase 1 that our envelope disagrees with the documented architecture is an expensive correction.

**Please commit the handbook to `docs/architecture/` before M1**, or tell me explicitly to design these from scratch and treat my versions as authoritative. Either answer works; not choosing is the bad outcome.

---

## 1. What could break the live site — and how we avoid it

The site is the company's only public surface and, via `/book-demo`, its only working lead channel. Ranked by expected damage.

### 🔴 High

| Risk | How it happens | Mitigation |
|---|---|---|
| **We break the site and don't notice** | No CI, no tests, **no analytics**. A regression in traffic or conversion is currently undetectable. | This is the root risk behind [ADR-001](ADR-001-repo-structure.md). CI lands in M1; analytics is pulled forward to **M0/M1** rather than M5 so a baseline exists *before* we start changing pages. |
| **Deploy-config change takes production down** | Changing Vercel's Root Directory for an `apps/web` move; a bad `vercel.json`. | **ADR-001 avoids this entirely** — the web app stays at the repo root and Vercel's project config is never touched during Phase 0. If we later move, it is a layout-only PR rehearsed on a preview deploy. |
| **Type errors ship to production** | [next.config.ts](next.config.ts) sets `typescript.ignoreBuildErrors: true`. The Vercel build is the only gate and it has been told to look away. | Remove it in **M0**. Source is already clean (`tsc --noEmit` verified), so this costs nothing today and gets more expensive every week we wait. |
| **Legal exposure from customer uploads** | M3 accepts real hotel documents. `/privacy` is ~350 words of brochure-site boilerplate; there is no DPA. | Legal drafting starts **now** — longest lead time in the project and it is not an engineering task. Hard gate on M3 completion. |

### 🟡 Medium

| Risk | How it happens | Mitigation |
|---|---|---|
| **URL changes destroy accumulated SEO** | Following `Update.md` §10 literally: `/blog/*`→`/resources/*`, `/privacy`→`/legal/privacy`. 23+ indexed URLs affected. | **Don't.** [PHASE-0-PLAN.md](PHASE-0-PLAN.md) M5 keeps existing paths. Any future move needs 301s and a deliberate decision. |
| **Route-group move changes a URL by accident** | Moving 15 route directories into `(marketing)` in M2. Route groups shouldn't affect paths — but "shouldn't" needs proving. | Automated check in CI: all known URLs return 200 with unchanged canonicals. Added as an explicit M2 acceptance criterion. |
| **Authenticated app degrades the marketing site** | Shared layouts, shared client bundles, a slow session check in `proxy.ts` running on marketing routes. | Separate route groups; marketing stays static/prerendered; `proxy.ts` matcher scoped to `(app)` and `(admin)` **only** — never marketing paths. |
| **Canonical-host confusion worsens** | Canonicals, sitemap and robots point at the apex, which 308s to www. Adding auth routes on the "wrong" host compounds it. | Resolve in **M0** (Decision 1) before any new routes exist. |
| **Known CVEs in the image pipeline** | 3 high-severity `sharp`/`libvips` + `postcss` advisories via `next@16.2.9`. `sharp` runs on every page's images. | Bump to `next@16.2.12` in M0. Patch-level, same minor. Add `npm audit` to CI. |
| **Streaming answers get truncated** | Proxying SSE through a Vercel function subject to max invocation duration. | Stream Railway→browser directly; Next.js only mints the short-lived JWT. Designed in at M4, not discovered at M4. |

### 🟢 Low

- 28 MB of PNGs in `public/` slows clones and Vercel build context. Cosmetic; fix opportunistically.
- Asset filenames with spaces and trailing spaces (`Butelr new image .png`) — fragile on case-sensitive CI filesystems. M0 housekeeping.
- No `.gitattributes` → CRLF/LF churn across machines. M0.

### Standing rules for every Phase 0 session

1. Never commit to `main`. Every change goes through a PR with a Vercel preview.
2. Never touch `vercel.json`, the Vercel project settings, or DNS without explicit approval in that session.
3. Marketing routes stay statically prerendered. If a change makes one dynamic, that is a finding to report, not a detail to absorb.
4. **Do not disturb the uncommitted blog work** (`src/lib/blog-data.ts`, `src/app/blog/[slug]/page.tsx`, three new images). It predates this session.
5. Any change touching a marketing route reports before/after **mobile** Lighthouse.

---

## 2. Decisions I need from you

| # | Decision | Why it's yours | Blocks | Cost of deciding late |
|---|---|---|---|---|
| **1** | **Canonical hostname: `www.soyl.cloud` or `soyl.cloud`?** Production serves **www**; all code says apex; `Update.md` §10 says "no www". | Brand call. Both are technically fine — but it must be *one*, and switching after we add authenticated routes and submit a sitemap is worse. | M0, M5 | Low now, medium later |
| **2** | **Does Phase 0's advisor product replace the current positioning, or sit alongside it?** The site sells Butler AI / PMS Lite / SOYL Dine with 16 comparison pages; Phase 0 builds an owner-facing document advisor, and §4 puts PMS integrations and ADR/RevPAR **out of scope** — both advertised on `/products/pms-lite` today. | Pure product/positioning. Not mine to make. | M5 scope (±1 week) | **High** — determines whether M5 is "add a page" or "rewrite the story" |
| **3** | **Which analytics tool?** Nothing is installed. `Update.md` §10 wants privacy-respecting analytics + own `analytics.event` capture. | Vendor choice with privacy-policy consequences. | M1 (pulled forward from M5) | **High** — every week without it is a week of baseline we can't recover |
| **4** | **Is Phase 0 staffed by two engineers?** The 7–8 week budget and my 9.5-week revision both assume two. | Resourcing. | Whole plan | **High** — at one engineer this is ~17 weeks elapsed |
| **5** | **Where should `/contact` submissions go?** Inbox, CRM, Slack? | Yours. | M0 | **Urgent** — leads are being lost today |
| **6** | **OCR vendor** for scanned/layout-complex documents (§8). | Cost and data-processing implications; hotel documents pass through it. | M3 | Medium |
| **7** | **Approve or reject [ADR-001](ADR-001-repo-structure.md).** | Architecture, but you asked to approve it. | M1 | — |

**Genuinely blocking M1: #7, #4, #3.** Decisions #1 and #5 block M0, which precedes M1 and can otherwise start immediately. #2 and #6 can wait but get more expensive.

---

## 3. What you need to provide that isn't in the repo

Ordered by when I need it. Items marked **⚠** have lead times longer than the milestone that needs them — start those now.

| When | What | Notes |
|---|---|---|
| **Now ⚠** | **The architecture handbook**, committed to `docs/architecture/` | See §0. Or a decision to design from scratch. |
| **Now ⚠** | **Draft privacy policy, terms and DPA** — lawyer engaged | **Longest lead time in the project.** Hard gate on M3. Must cover: customer document storage, model-provider processing, sub-processors, data residency, retention, deletion. Also resolve the §6.5 "log permanently" vs. erasure-request tension (see [PHASE-0-PLAN.md](PHASE-0-PLAN.md)). |
| **Now ⚠** | **2–3 pilot hotels** willing to hand over real documents | On the critical path from M3. M4 **cannot be accepted** without them — its criteria require 40 labelled pairs from real pilot documents. |
| **Now** | **Vercel account access** (or confirmation you retain it) | I should not need to change settings, but I need to *see* build logs and preview deploys. |
| **Now** | **Registrar / DNS access** | Needed for Decision 1, and later for SPF/DKIM. |
| **M0** | Contact-form destination (Decision 5) | |
| **M0** | Analytics account (Decision 3) | |
| **M1** | **Managed Postgres 16 with `pgvector`** | ⚠ **Hard selection criterion:** must grant `CREATEROLE`. `Update.md` §6.1 requires an app role without `BYPASSRLS` **and** a separate migration role. Providers that hand you one near-superuser and nothing else **cannot satisfy the non-negotiable.** Verify before committing. |
| **M1** | **Managed Redis** | For ARQ. |
| **M1** | **Railway account** (API + worker + staging/production) | Web stays on Vercel per ADR-001. |
| **M1** | **Object storage** — Cloudflare R2 or equivalent | Accessed only via `StoragePort`. MinIO covers local dev. |
| **M2** | **Google OAuth client credentials** | Authorized redirect URIs must match the Decision 1 hostname. |
| **M2** | **Sending domain for transactional email + DNS access for SPF/DKIM** | ⚠ Email verification and password reset are M2 acceptance criteria. **Domain warm-up and DKIM propagation take days** — start in M1. |
| **M3** | **Model provider account + API key, with a zero-retention agreement** | ⚠ Zero-retention is often a **contract negotiation, not a checkbox**. Needed for embeddings at M3, generation at M4. Start early. |
| **M3** | **OCR vendor account** (Decision 6) | |
| **M4** | **~1 day of your time** to label 40 question/chunk pairs | Requires hotel-operations judgement. Cannot be delegated to me. |
| **M5** | **Google Search Console access** | To submit the sitemap and see whether the canonical-host issue has cost us anything. |

---

## 4. Things about the existing setup that will limit us later

Not bugs — structural facts worth knowing before they surprise us.

1. **Everything is `"use client"`.** 25 files, including nearly every `page.tsx`. It works and still prerenders, but it is why mobile is at 71 and it makes the M5 "≥ 90 mobile perf" criterion real work rather than a formality. It also means the codebase's default instinct is client-first — the opposite of what the authenticated app should be, where the Next auth guide is explicit that authorization belongs in a server-side Data Access Layer, not in client components.

2. **All content is hardcoded in TypeScript.** [blog-data.ts](src/lib/blog-data.ts), [competitors.ts](src/lib/competitors.ts), [faq-data.ts](src/lib/faq-data.ts). The model is genuinely well designed, but **publishing an article requires a code change, a PR and a deploy.** §10 calls resources "a 3–6 month investment; start publishing in week one." If a non-engineer will ever write a post, this becomes a bottleneck — and the answer (MDX or a CMS) is out of Phase 0 scope. Flagging so it's a choice, not a surprise.

3. **Two animation libraries.** `framer-motion` and `gsap` both ship to every page. Consolidating is an M5 perf task with UI-regression risk across 41 pages.

4. **`SectionHeader` hardcodes `<h2>`.** The cause of five missing `h1`s. Symptomatic of components that bake in semantics — worth watching as the component kit grows.

5. **Next.js 16 is ahead of most published guidance.** `middleware`→`proxy`, `next lint` removed, async request APIs, Turbopack by default. Third-party integration docs (Auth.js especially) largely target 14/15. **Expect to read `node_modules/next/dist/docs/` rather than trusting tutorials** — as `AGENTS.md` already instructs. Budgeted as a one-day Auth.js spike at the top of M2.

6. **No staging environment for the web app.** Vercel preview deploys per PR are good but ephemeral, and they run against production data by default once a backend exists. M1 should define which API environment previews point at — almost certainly staging, never production.

7. **Vercel + Railway split means two logging and observability surfaces.** `Update.md` §13 requires `trace_id` on every log line and in every error response. Propagating a trace across a Vercel-hosted frontend and a Railway-hosted API needs deliberate design in M1, not retrofitting in M4.

8. **The `/security` page makes concrete claims** — AES-256, GDPR compliance, RBAC — for a product that currently stores no customer data. Once M3 ships, those claims become things we must actually be doing. Worth a review alongside the legal drafting.
