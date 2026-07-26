# ADR-001 — How Phase 0 is structured into this repository

- **Status:** **Accepted** — approved in [DECISIONS.md](../../DECISIONS.md) §1, conditional on the migration trigger below
- **Date:** 2026-07-26 (proposed) · 2026-07-27 (accepted)
- **Deciders:** Founding engineer (proposing), Founder (approving)
- **Supersedes:** `Update.md` §5 "Monorepo — pnpm + Turborepo"
- **Related:** [REPO-AUDIT.md](REPO-AUDIT.md), [PHASE-0-PLAN.md](PHASE-0-PLAN.md), [RISKS.md](RISKS.md)

---

## Context

`Update.md` §5 mandates: *"Monorepo — pnpm + Turborepo. `apps/web`, `services/api`, `services/worker`, `packages/contracts`."* It was written assuming an empty directory. The directory is not empty.

The facts that bear on this decision, from [REPO-AUDIT.md](REPO-AUDIT.md):

1. **The site is live and it is good.** 41 prerendered static pages on Vercel, desktop Lighthouse 94–99 perf / 100 SEO, `bom1` edge. It is the company's only public surface and its only lead channel.
2. **There is no CI, no tests, and no analytics.** The Vercel build is the only gate, and `typescript.ignoreBuildErrors: true` has disabled even that. **We currently have no automated way to detect that we have broken the site.**
3. **Next.js 16.2.9 with npm.** Already ahead of the brief's Next 15 target. The lockfile and build are healthy.
4. **Vercel's Root Directory is the repo root.** Moving the app is not a `git mv` — it is a change to live production deploy configuration.
5. **Zero backend surface.** No API routes, no `proxy.ts`, no env vars, no auth. Nothing to unpick.
6. **Two of the three Phase 0 services are Python.** Turborepo orchestrates JavaScript tasks; it has nothing useful to say about `uv`, `ruff`, `mypy` or `alembic`.
7. **The Phase 0 admin panel lives inside the Next.js app** (`Update.md` §11: internal routes behind a `soyl_staff` role). So Phase 0 has exactly **one** JavaScript application, not two.

The question is not "monorepo or polyrepo" — one repo is clearly right for a team of two to three making atomic changes across a Pydantic→Zod contract boundary. The question is **how much structural change to make now, and in what order relative to building the safety net.**

---

## Decision

**Adopt Option C: incremental workspace. Add the new services around the existing app rather than relocating it, and defer the `apps/web` move until it earns its cost.**

Concretely, the Phase 0 layout becomes:

```
soyl-cloud/
├── src/                     ← Next.js app STAYS AT ROOT (marketing + authenticated + admin)
│   ├── app/
│   │   ├── (marketing)/     ← existing routes, moved into a route group (URLs unchanged)
│   │   ├── (app)/           ← new: authenticated product surface
│   │   ├── (admin)/         ← new: internal panel, soyl_staff only
│   │   └── api/             ← new: auth handlers + BFF proxy to the Python API
│   ├── components/
│   ├── lib/
│   └── proxy.ts             ← new: Next 16 name for middleware (session gate)
├── packages/
│   └── contracts/           ← npm workspace: generated Zod + TS from Pydantic
├── services/
│   ├── api/                 ← Python 3.12 / FastAPI / uv
│   └── worker/              ← Python / ARQ
├── docs/
├── package.json             ← workspace root AND the web app
├── docker-compose.yml       ← new: Postgres 16 + pgvector, Redis, MinIO
├── Makefile                 ← new: make setup / make dev
└── .github/workflows/       ← new: CI
```

Four deliberate deviations from `Update.md` §5:

| Brief says | We do | Because |
|---|---|---|
| `apps/web` | Web app stays at repo root | Vercel Root Directory stays unchanged → the live-site deploy config is never touched |
| pnpm | **npm** (keep `package-lock.json`) | `packages/contracts` needs *workspaces*, which npm has had since v7. pnpm buys disk efficiency we don't need and costs a lockfile regeneration on a working build. |
| Turborepo | **npm scripts + `make`** | Turborepo caches JS task graphs. Two of three services are Python. One JS app ⇒ no task graph to orchestrate. |
| Deploy web to Railway | **Web stays on Vercel**; API + worker on Railway | Vercel's edge CDN and `/_next/image` transform are *why* LCP is currently good (790 KB PNG → 36 KB). Moving the live site to Railway is gratuitous risk and a measured performance regression. |

**The single most important part of this decision is the ordering, not the layout:** CI, a green typecheck, and Lighthouse budgets land in M1 **before** any structural move is contemplated. Today we would be migrating blind.

---

## Alternatives considered

### Option A — Purely in place

Add authenticated routes alongside marketing routes; add `services/api` and `services/worker` at top level. Do nothing else.

- **For:** Zero disruption. Fastest to M1.
- **Against:** Gives no home for `packages/contracts`. `Update.md` §6.3 requires the Response Envelope schema to be generated from Pydantic into Zod and TypeScript and consumed by the frontend — a genuine shared package with a generation step. Without a workspace, that becomes a copied file that silently drifts from the Pydantic source. Drift in the envelope contract is exactly the failure mode that produces unrenderable answers in production.
- **Verdict:** Rejected. It is Option C minus the one piece of structure that is actually load-bearing. The workspace is cheap (`"workspaces": ["packages/*"]`, one line) and the thing it protects is a non-negotiable.

### Option B — Full monorepo migration now

Move the site to `apps/web`, add `services/*` and `packages/contracts`, migrate npm → pnpm, adopt Turborepo, rewrite deploy config.

- **For:** Matches the handbook and `Update.md` exactly. Never has to be done later. Genuinely cheaper at 137 files than at 500.
- **Against — and this is the decisive point:** it changes **four things at once** — directory layout, package manager, build orchestrator, and live deploy configuration — on a production site that has **no CI, no tests, and no analytics to detect a regression**. If organic traffic drops after the migration, we would not know, and we would have four simultaneous changes to bisect through. The `pnpm import` step regenerates the dependency tree of a currently-working Next 16 build; the Vercel Root Directory change is a dashboard edit with no staging rehearsal and no rollback beyond editing it back.
- **The strongest argument for B is real:** structural moves get more expensive over time. But that argument assumes the cost curve is steep. Here it is nearly flat — the web app is self-contained under `src/` with a single `@/*` path alias and no cross-package imports. Moving `src/` to `apps/web/src/` in three months is the same `git mv` plus the same Vercel setting change, just executed **with CI proving the build and Lighthouse proving the performance**. We are deferring a cheap operation to a moment when it is safe, not deferring an expensive one to a moment when it is expensive.
- **Verdict:** Rejected *for now*, not rejected in principle. See the trigger below.

### Option D — Split repositories

`soyl-cloud` (web) + `soyl-api` (Python).

- **Against:** The Pydantic → Zod contract generation would cross a repo boundary, requiring a published package and version coordination for every envelope change. For a team of two to three shipping daily, that is pure friction. Two-repo atomicity problems are the thing monorepos exist to solve.
- **Verdict:** Rejected.

---

## Consequences

### Positive

- **The live site's deploy path is never touched during Phase 0.** Vercel Root Directory, build command and output directory stay exactly as they are. The highest-severity risk in [RISKS.md](RISKS.md) is removed rather than mitigated.
- Marketing routes stay static and prerendered. Authenticated routes are dynamic in a separate route group. **A slow or broken authenticated app cannot degrade the marketing site** — different rendering modes, no shared data fetching.
- Existing URLs are unchanged. Route groups `(marketing)`, `(app)`, `(admin)` do not appear in paths, so `/pricing` stays `/pricing`. **No redirects, no SEO risk.**
- `packages/contracts` exists from M1, so the envelope contract is generated and type-checked end to end from the first answer the system gives.
- One `npm install`, one lockfile, one language toolchain for JS. Python is managed by `uv` independently, which is what `uv` is good at.
- Railway hosts only what needs to be long-running and stateful (API, worker, Postgres, Redis). Vercel hosts what benefits from an edge CDN.

### Negative

- **Deviates from the handbook's stated layout.** If the handbook's structure later matters for reasons beyond Phase 0 (it is not in the repo — see [RISKS.md](RISKS.md) §1), we will have to converge. The trigger below is how we do that deliberately.
- The root `package.json` is both the workspace root and the web app's manifest. Legal and common in npm workspaces, but slightly untidy: app dependencies and workspace configuration share a file.
- Two deploy targets with two mental models (Vercel for web, Railway for services). Mitigated by the fact that this is already true of every Next.js + Python stack.
- `services/` Python directories sit in Vercel's clone context. Needs a `.vercelignore` so build context stays small. Trivial, but must not be forgotten.
- **We will probably do the `apps/web` move eventually.** This decision accepts paying a small cost twice rather than a large risk once.

### The migration trigger — binding

> **Migrate to a monorepo (`apps/web`, pnpm + Turborepo) when a second JavaScript application is added, or at the start of M4, whichever comes first.**

This is the condition the founder attached to accepting this ADR ([DECISIONS.md](../../DECISIONS.md) §1), and it is the operative clause. A deferred change with no date becomes a permanent one; the date is M4.

Two things follow from it:

- **M4 planning starts with the migration PR.** It is the first item in that milestone, not something squeezed in beside retrieval work. By then M1 has given us CI, tests and analytics — the safety net whose absence is the entire reason for deferring.
- **Adding a second JS app before M4 pulls the migration forward to that moment.** Do not add one and route around the trigger.

The following are *early warnings* that the trigger is close, not additional triggers:

1. **CI runtime exceeds ~10 minutes** and Turborepo's remote caching would materially help.
2. A **second JS package** beyond `contracts` appears (a shared UI kit).
3. Phase 1 begins and the handbook's structure becomes binding for reasons outside Phase 0.

**Precondition on any future move:** CI green, Lighthouse budgets enforced, and the migration executed as a **single PR that changes only layout** — never bundled with a feature.

---

## Reversal cost

| From → To | Cost | Notes |
|---|---|---|
| **C → B** (root → `apps/web`, add pnpm/Turbo) | **0.5–1.5 days** | `git mv` preserves history with `--follow`. `@/*` alias is relative to `tsconfig.json`, so it moves with the app unchanged. One Vercel dashboard change (Root Directory → `apps/web`). Rehearsable on a preview deploy first. **This is the cost we are deferring, and it does not grow materially** — the app has no cross-package imports to untangle. |
| **C → A** (drop the workspace) | **~1 hour** | Delete `packages/contracts`, inline the generated types. |
| **C → D** (split repos) | **2–3 days** | Extract `services/`, set up contract publishing. Genuinely expensive — but nothing in C makes it *harder* than starting from B would. |
| **npm → pnpm** alone | **~2 hours** | `pnpm import` reads `package-lock.json`. Independent of the directory move; can be done separately if desired. |
| **Vercel → Railway for web** | **1 day + measured regression** | Would need to replicate image optimization and edge caching. Not recommended. |

The asymmetry that drives this ADR: **reversing C costs about a day of mechanical work. Reversing a botched B on a live site costs an outage of unknown duration plus an unmeasurable SEO impact, because we have no analytics to measure it with.**

---

## Recommendation to the founder, in two sentences

Build the authenticated app and the Python services *around* the existing site rather than relocating it, because the live marketing site currently has no CI, no tests and no analytics — so a package-manager-plus-layout-plus-deploy-config migration today would be performed blind, with no way to detect that we had broken the company's only lead channel. The `apps/web` move is a one-day mechanical change whose cost does not grow, so we should do it *after* M1 gives us a safety net, and only once a second JavaScript app actually needs it.
