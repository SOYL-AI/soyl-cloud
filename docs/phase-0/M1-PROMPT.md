# M1 kickoff prompt

Paste everything below the horizontal rule as your next message to Claude Code, from the repo root.

---

M0 accepted. The errata was the most useful thing in it — `UPDATE-ERRATA.md` §D3 caught a non-negotiable I had dropped from `AGENTS.md`. **I've fixed it: the list is now nine items and PII minimisation is back at §8.** You were right not to edit it yourself, and right to flag it as the mechanism by which a rule disappears quietly. Keep doing that.

Two other things from your log I'm acting on rather than filing:

**1. The branch-deploys-to-production finding is the most serious thing in M0.** `AGENTS.md` says "never commit to `main`" and you discovered that's not a safety mechanism at all — pushing `phase-0/m0` put M0 live on `www.soyl.cloud` without a merge. I'm pinning the Vercel production branch to `main` before you start M1. **Do not push anything until I confirm that's done.** Ask me if I haven't said so.

**2. The Postgres provider check is unrun and it gates migration 001.** That's mine to do — it needs accounts you don't have. I'm running it against Neon and Supabase now. See §"Sequencing around the provider check" below for how M1 proceeds without waiting on me.

Everything else in the decision log I accept as written. The `SectionHeader` `as` prop, `SITE_URL` as a separate constant from `COMPANY.domain`, blocking CI on build and tests while reporting on typecheck and lint, Node's built-in test runner, in-process rate limiting — all correct calls with the reasoning I'd have wanted.

## What M1 actually is

Smaller than `UPDATE.md` §12 describes, because you did part of it in M0. Per your own `UPDATE-ERRATA.md` §C4: CI, the test runner and the build gate are done. What's left is the local stack, the Python service, and the database.

This milestone is where the tenancy model gets decided in concrete. It is the one thing in Phase 0 that cannot be retrofitted, so I would rather M1 take an extra three days than be approximately right.

| # | Item | Notes |
|---|---|---|
| 1.1 | **npm workspaces** | Per ADR-001, in place. Root `package.json` gains `workspaces`. The Next app stays exactly where it is — do not move `src/`. Add `services/api` and `packages/contracts`. |
| 1.2 | **Docker Compose local stack** | Postgres 16 with `pgvector`, Redis, MinIO. Pinned image digests, not `:latest`. One command up, one command down, seeded. |
| 1.3 | **FastAPI skeleton** | Layered per `docs/architecture/04-backend.md` §21, but only `identity` and `property` domains exist yet. `uv` for dependencies. `/health` that actually checks Postgres and Redis, not one that returns `{"ok": true}` unconditionally. |
| 1.4 | **Settings validation** | Per `docs/architecture/10-security-devops.md` §62.1 — typed, `extra="forbid"`, production invariants in a validator, fails at startup rather than at 3am. |
| 1.5 | **Alembic + migration 001** | `core.tenant`, `core.property`, `core.user_account`, `core.membership`, `core.membership_property`, plus `leads`. RLS enabled **and forced** on every tenant-scoped table. Schema in `UPDATE.md` §7. |
| 1.6 | **Two database roles** | `soyl_migrator` owns the tables; `soyl_app` connects and holds no `BYPASSRLS` and no membership of the migrator. Wired into Compose so local matches production. |
| 1.7 | **Tenant isolation test suite** | The centrepiece. See acceptance below. |
| 1.8 | **Contact form persists** | `leads` table, written alongside the existing Resend email. Email stays as the notification path — do not replace it. Per `DECISIONS.md` §4. |
| 1.9 | **Type errors fixed, typecheck blocking** | Remove `typescript.ignoreBuildErrors` from `next.config.ts`, fix what surfaces, flip CI to blocking. Report the count before you start fixing. |
| 1.10 | **Railway environments** | `api` service, staging and production, deploying from `main`. Web stays on Vercel. |
| 1.11 | **`/privacy` names Plausible** | One sentence, per `UPDATE-ERRATA.md` §D2. M0 was barred from content changes; M1 isn't. Smallest legal item on the list and it shouldn't wait for the lawyer. |

### On the `leads` table specifically

**It is deliberately not tenant-scoped.** A lead arrives before any tenant exists, so it has no `tenant_id` and no RLS policy. Say so in a comment on the table. I'm calling this out because a blanket "every table gets `tenant_id`" reading of the non-negotiables would invent a column here that means nothing — and because the isolation test in 1.7 needs to be written so this table doesn't produce a false failure.

## Acceptance criteria

M1 is done when all of these pass, not when the code exists.

1. **Clone to running stack in under 30 minutes** on a machine that has never seen this repo. Time it honestly — if it's 45 minutes, the number in `UPDATE.md` §12 is wrong and I want to know rather than have it rounded down.

2. **The tenant isolation suite proves isolation, and cannot be skipped.** Specifically:
   - For every repository method that reads tenant-scoped data, a test asserting tenant B's context returns zero of tenant A's rows.
   - A test asserting that with `app.tenant_id` **unset**, a tenant-scoped query returns zero rows — not an error, not everything. Failing closed is the property that matters.
   - A test asserting `soyl_app` cannot `DISABLE ROW LEVEL SECURITY` and cannot `SET ROLE soyl_migrator`.
   - **A schema-wide assertion**: query `pg_tables`/`pg_class` and assert that every table possessing a `tenant_id` column has both `rowsecurity` and `forcerowsecurity` true. This is the one that catches the table someone adds on a Friday without a policy. It should fail loudly the moment a new table forgets.
   - The suite runs in CI on every PR and is not marked skippable, conditional, or `continue-on-error`.

3. **`POSTGRES-PROVIDER-CHECK.md` runs green against the local Docker Postgres.** Not as a substitute for the provider trials — as proof the check script itself is correct before I run it against a provider. If the script has a bug, I want it found here rather than concluding a provider failed.

4. **`/health` returns unhealthy when Postgres is stopped.** Verify by actually stopping it.

5. **Typecheck is blocking in CI and passes.** `ignoreBuildErrors` gone from `next.config.ts`.

6. **A contact submission lands in `leads` and sends the email**, verified end to end. If the database write fails, the email still sends and the user still sees success — the notification path must not become newly fragile because we added persistence behind it.

7. **Railway `api` responds on staging**, from a deploy triggered by `main`.

## Sequencing around the provider check

Don't block on me. Build M1 against the local Docker Postgres, which supports roles and RLS by construction. Migration 001's *shape* only changes if no managed provider can give us two roles — and if that happens we have a much bigger conversation than a migration.

What I need from you to make my part fast: **flag anything in migration 001 that depends on a provider capability beyond the two roles.** Extensions in particular — `pgvector` is needed in M3, and some providers gate extensions behind an allowlist. Better to discover that now.

## Out of scope for M1

Auth (M2). Any `rag.*` or `ai.*` table. Document upload. The `"use client"` audit and any performance work (M5). Any dependency upgrade not required by 1.1–1.11. Do not touch the marketing site's routes or content beyond the one `/privacy` sentence.

## Report back with

1. Each acceptance criterion and how you verified it — for #1, the actual elapsed time.
2. The typecheck error count you found before fixing, and what the fixes revealed. If any of them were masking a real bug rather than a type nit, say so.
3. Anything in migration 001 that depends on a provider capability I should test for.
4. Whether `UPDATE.md` §7's schema survived contact with reality, and what you'd change.
5. Anything you disagreed with in this prompt and did differently.

Then stop. M2 is the next session.
