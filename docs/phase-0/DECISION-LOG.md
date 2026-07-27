# Decision log

One line per non-obvious decision made on the founder's behalf, with the reason. Newest last.

Format: `date · milestone · decision — reason`

---

## M0

- 2026-07-27 · M0 · **ADR-001 marked Accepted, with the founder's migration trigger promoted above the old four-condition list** — the old list had no date, which is exactly the failure mode DECISIONS.md §1 objected to. The remaining conditions are kept as early warnings, not as alternative triggers.
- 2026-07-27 · M0 · **Analytics is Plausible, not Umami** — Umami needs a host, a Postgres and an uptime story we do not have until M1; Plausible is live the same day and the reason for choosing this class of tool (no cookies, no consent banner) is satisfied identically by both. Reversible: both accept a one-script swap and neither owns data we cannot re-derive.
- 2026-07-27 · M0 · **Transactional email via Resend's REST API over `fetch`, no SDK** — M0 is explicitly barred from dependency changes, and the send is one HTTP POST. Keeps the provider behind `src/lib/email.ts` so swapping it is one file.
- 2026-07-27 · M0 · **Rate limiting is in-process, per instance** — no Redis until M1. Documented as best-effort in the code; the honeypot and the required fields carry most of the load. Revisit when Redis exists.
- 2026-07-27 · M0 · **Tests run on Node's built-in test runner with `--experimental-strip-types`** — the alternative was adding vitest, which M0's scope bars. Zero dependencies, runs the same locally and in CI. Reconsider when the API service arrives and a real runner is justified.
- 2026-07-27 · M0 · **Canonical host lives in a new `SITE_URL` constant, not in `COMPANY.domain`** — `COMPANY.domain` reads as a brand fact and is used in prose; the canonical origin is an infrastructure fact and needs `www`. Separating them stops the next edit from re-introducing the split.
- 2026-07-27 · M0 · **The favicon was trimmed of its ~25% transparent margin before resizing** — the mark occupied half the 1024px canvas, so a straight downscale to 32px left it unreadable in a tab. Appearance at large sizes is unchanged; this only affects the icon.
- 2026-07-27 · M0 · **CI blocks on build and tests, reports on typecheck and lint** — the build is the guard that protects the live site and it passes today, so blocking on it costs nothing and catches a real break. Typecheck and lint have known failures; blocking on those would fail every PR from the first one and train us to ignore CI.
- 2026-07-27 · M0 · **Lighthouse deliberately left out of CI** — same reason. `BASELINE.md` records the numbers; M5 adds the gate once there is something worth defending. `UPDATE.md` §10 asks for it on every PR from the start.
- 2026-07-27 · M0 · **`COMPANY.domain` kept as an alias of `SITE_HOST` rather than removed** — ~40 call sites use it, one of which sits in uncommitted blog work. Aliasing fixed them all without touching a file someone else has open.
- 2026-07-27 · M0 · **`SectionHeader` gained an `as` prop defaulting to `h2`** — every existing call site keeps its current output; only the five pages that use it as their page title opt into `h1`. A codebase-wide default change would have been the riskier edit.
- 2026-07-27 · M0 · **Discovered that pushing a branch deploys it to the production domain** — pushing `phase-0/m0` put M0 live on www.soyl.cloud without a merge. `AGENTS.md`’s "never commit to main" is therefore not the safety mechanism it reads as; the Vercel project needs its production branch pinned to `main`. Flagged to the founder, not changed — it is in a Vercel account this environment cannot reach.

## M1

- 2026-07-27 · M1 · **Neither database role has `BYPASSRLS`, contradicting the handbook §48.7** — granting `BYPASSRLS` requires superuser, which managed providers generally do not give out, so requiring it for `soyl_migrator` would have made migration 001 unportable to Neon and Supabase. A migration that must touch tenant rows toggles `FORCE` off inside its own transaction instead, which the table owner may do unaided.
- 2026-07-27 · M1 · **`core.membership_property` gains a `tenant_id` that `UPDATE.md` §7 does not specify** — with only the two foreign keys it is the one tenant-scoped table RLS cannot protect directly, and the schema-wide assertion would have had to special-case it. Reachability through `core.membership` is not the same guarantee as a policy.
- 2026-07-27 · M1 · **`core.user_account` is deliberately not tenant-scoped and has no RLS** — a user may hold memberships in several tenants, and login must resolve a user by email before any tenant is known. Tenancy lives on `core.membership`. Recorded as a named exception in the isolation suite so it cannot be mistaken for an oversight.
- 2026-07-27 · M1 · **`core.tenant`'s policy keys on `id`, not `tenant_id`** — the tenant *is* the row. A side effect worth knowing before M2: a tenant row can only be inserted by a session already scoped to its own id, so signup must generate the UUID first and set the context before writing.
- 2026-07-27 · M1 · **Policies carry `WITH CHECK` as well as `USING`** — `USING` alone filters reads and still permits inserting a row stamped with another tenant's id: invisible to them afterwards, but present, and counted in their exports and their bill.
- 2026-07-27 · M1 · **Migration and admin credentials live in `.env.migrations`, not `.env`** — `Settings` uses `extra="forbid"`, which caught the API process being handed the migrator credential through a shared file. The separation is now enforced by the same rule rather than by intention.
- 2026-07-27 · M1 · **Leads are written by calling the API, not by adding a Postgres driver to the web app** — keeps the RLS-role story in one place and avoids a serverless function opening connections to Postgres per submission. Costs a shared bearer token until M2's JWT exchange.
- 2026-07-27 · M1 · **Compose publishes Postgres on 5433 and Redis on 6380** — a developer machine with Postgres installed already owns 5432, and on Windows the published port binds without error while connections still reach the native service. It presents as `password authentication failed for user soyl_migrator`.
- 2026-07-27 · M1 · **Railway's healthcheck points at `/live`, not `/health`** — Railway restarts a container that fails its healthcheck, so checking Postgres there converts a database blip into a restart loop.
- 2026-07-27 · M1 · **Lint stays non-blocking while typecheck becomes blocking** — the 15 lint errors are pre-existing and mostly accessibility-related, which is M5's work. Typecheck was at 1 and is now 0, so blocking it costs nothing today and prevents the debt returning.

## M3

- 2026-07-28 · M3 · **Building M3 before the legal review, with an explicit boundary** — `DECISIONS.md` §6 makes the lawyer a hard gate on M3. The founder has chosen to proceed and audit later. The gate is read as binding on *a hotel uploading its documents*, not on the pipeline existing: M3 is built and tested against our own documents, and **no pilot hotel uploads anything until the DPA is signed**. That line is the whole of the deviation; if it moves, the deviation becomes the thing §6 actually forbids.
- 2026-07-28 · M3 · **Two DPDP-relevant designs are being brought forward rather than retrofitted** — real erasure (documents, chunks and embeddings, not just `deleted_at`) and PII minimisation before inference (`UPDATE.md` §6.8). Both are cheap now and expensive after a corpus exists, and both are what a processor DPA will be audited against.

