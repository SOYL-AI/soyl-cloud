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
- 2026-07-27 · M0 · **`SectionHeader` gained an `as` prop defaulting to `h2`** — every existing call site keeps its current output; only the five pages that use it as their page title opt into `h1`. A codebase-wide default change would have been the riskier edit.
