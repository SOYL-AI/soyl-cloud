<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# SOYL — project context

## What this is

`soyl.cloud` — currently a Next.js 16 marketing site, live in production on Vercel. We are building **Phase 0** of the SOYL Hotel Operating System into it: authentication, a document knowledge base, an AI answer surface with cited answers, and an internal admin panel.

## Read these, in this order

| File | What it is | Authority |
|---|---|---|
| `DECISIONS.md` | Founder's rulings, corrections and the working agreement | **Highest** |
| `UPDATE.md` | The Phase 0 build brief — scope, milestones, non-negotiables | Overrides the handbook |
| `docs/phase-0/` | Repo audit, ADR-001, the revised plan, risks | Current state |
| `docs/architecture/` | Long-term architecture handbook (13 files, start at `README.md`) | Reference only |

Precedence when they conflict: `DECISIONS.md` > `UPDATE.md` > `docs/architecture/`.

`docs/architecture/` describes **six phases**. We are executing **Phase 0**. Do not build from it anything `UPDATE.md` places out of scope. §2.4 and the Phase 1 plan in §68 assume an existing authenticated platform and are void.

## How we work

- **One milestone per session.** Stop at its acceptance criteria and report how you verified each one. Do not continue into the next milestone.
- **The site is live and it is the only lead channel.** Never commit to `main`. Verify the site still renders and the Calendly path still works after each deploy.
- **Tests are the code review.** There is one engineer. Where a colleague would have caught something, write a test instead.
- **Push back** on anything in these documents that is wrong given what the code actually is. Several assumptions have already turned out to be false.
- **Log non-obvious decisions** in `docs/phase-0/DECISION-LOG.md`, one line each, with the reason.

## Non-negotiables

Cheap now, expensive to retrofit. From `UPDATE.md` §6:

1. Row-level security in migration 001 — enforced in Postgres, not application code.
2. A tenant isolation test suite that cannot be skipped in CI.
3. The Response Envelope — structured JSON output, never a markdown string. `docs/architecture/03-generative-ui.md` §16, worked example in Appendix C.
4. Provenance on every claim; unprovenanced claims stripped by a deterministic validator.
5. Every question logged permanently — demand data, eval corpus and roadmap input in one table.
6. The usage ledger from the first model call.
7. `no-store, no-transform` on every streaming response.
8. No provider SDK imported outside the provider adapter layer.

## Known state

- `next.config.ts` sets `typescript.ignoreBuildErrors: true` — type errors currently ship. See `DECISIONS.md` §5 for the removal sequence; do not simply delete the flag.
- No CI, no tests, no analytics as of the audit.
- `src/app/contact/page.tsx` simulates submission and sends nothing. Being fixed in M0.
