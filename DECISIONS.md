# DECISIONS.md — Founder's rulings on the Phase 0 repo audit

**Status:** Authoritative. Where this file, `UPDATE.md` and `docs/architecture/` disagree, the order of precedence is:

```
DECISIONS.md  >  UPDATE.md  >  docs/architecture/
```

Last updated after the orientation session that produced `docs/phase-0/REPO-AUDIT.md`.

---

## 1. ADR-001 — approved as recommended

**Build in place. No monorepo migration now.**

The reasoning in `docs/phase-0/ADR-001-repo-structure.md` is correct: migrating package manager, directory layout and deploy configuration simultaneously, with no CI, no tests and no analytics, on the company's only working lead channel, is unjustifiable risk for zero present benefit.

Accepted deviations from `UPDATE.md` §5:

| Brief said | Actual | Reason |
|---|---|---|
| pnpm + Turborepo | **npm workspaces** | Repo already uses npm; migrating blind is the risk we're avoiding |
| Web on Railway | **Web stays on Vercel** | Edge CDN and image transform are why LCP is tolerable at all. API and worker go to Railway. |

**Condition — add this to the ADR before closing it.** An explicit migration trigger:

> Migrate to a monorepo when a second JavaScript application is added, **or** at the start of M4, whichever comes first.

A deferred one-day change with no trigger becomes a permanent one. I want the trigger written down, not the intent.

## 2. Staffing and timeline

**One engineer — me — working with Claude.** Others join later for optimisation.

- **Revised timeline: 12–14 weeks.** Not 9.5 (that assumed two engineers), not 17 (that assumed solo without tooling).
- **What does not compress regardless of tooling:** recruiting pilot hotels, my day labelling 40 retrieval pairs, the lawyer, and tuning retrieval until answers are genuinely good. Plan around those, not around code volume.
- **Where I cut if we run over:** M6 down to two screens (questions list, answer inspector), M5 down to performance fixes only. **Nothing comes out of `UPDATE.md` §6.**

### Working agreement

There is no second engineer to review your code. Compensate deliberately:

1. **Tests are the review mechanism.** Where you'd normally rely on a colleague catching something, write a test. Especially the tenant isolation suite and the retrieval assertions.
2. **One milestone per session.** Stop at the acceptance criteria and tell me how you verified each one. Do not roll into the next milestone because it looks obvious. The acceptance criteria are the only control mechanism in this project.
3. **Small, self-contained commits**, messages that explain *why*. Me reviewing this in three months has no context.
4. **Push back.** You've done it once already and it improved the plan. I'd rather argue now than discover it in month three.
5. **Maintain `docs/phase-0/DECISION-LOG.md`** — one line per non-obvious decision you make on my behalf, with the reason. This is what a second engineer would otherwise absorb by osmosis.

## 3. Analytics — Plausible or Umami, moved into M0

Pulled forward from M5. Every week without it is baseline we can never recover.

Plausible if you want it live today with no infrastructure; Umami if self-hosting is preferable. Pick one and tell me which. The reason for this class of tool over GA4 or PostHog is specific: **no cookies means no consent banner**, and our current privacy policy cannot support cookie-based tracking anyway.

Instrument day one: pageviews, contact form submit, Calendly interaction, outbound clicks. That is the entire current funnel.

## 4. Contact form — corrected instruction

I said "let it come to the admin dashboard we're going to make now." Taken literally that means leads keep vanishing until M6, six weeks away, and the database doesn't exist until M1. Not what I meant.

| When | What |
|---|---|
| **M0 — now** | Real handler → transactional email to a monitored inbox. Honeypot, server-side rate limit, real error state. Uses the sending domain we need for M2 anyway. |
| **M1** | Also persist to a `leads` table the moment Postgres exists. Email stays as the notification path. |
| **M6** | Leads screen in the admin panel, reading that table. |

**The failure mode I care most about is the current one:** `src/app/contact/page.tsx` runs a 1-second `setTimeout`, sets `submitted`, and sends nothing. The form must never again tell a visitor it succeeded when it didn't. If the send fails, the user sees an error and a fallback address.

Also: check whether any estimate of lost volume is recoverable from Vercel logs. I don't expect the submissions, just a count.

## 5. Corrections to UPDATE.md

Three findings from the audit are correct and I'm adopting them.

### M5 was wrong — it is a performance job, not a build

I scoped M5 as "build the marketing site" against a site that already has 41 prerendered pages, generated sitemap and robots, per-page canonicals, extensive JSON-LD, 7 articles and 16 comparison pages. **Acceptance criteria stand unchanged** — mobile LCP ≤ 2.0s is the bar, we're at 5.6s. The work changes:

1. Fix `src/app/icon.png` — **285 KB**, the heaviest request on every page on the site.
2. The `"use client"` audit — 25 files including nearly every `page.tsx`. This is the real mobile LCP cause. **Route by route with before/after Lighthouse numbers, not one sweep, and only after CI exists.** Most likely place to break something silently.
3. Consolidate animation libraries. `framer-motion` and `gsap` both loading is indefensible; keep whichever is doing more work.
4. Fix `src/components/ui/SectionHeader.tsx` — one hardcoded `<h2>` costing five routes their `<h1>`.
5. Canonical host consistency.
6. Re-baseline Lighthouse, submit sitemap to Search Console.

### Four items move into M0

Favicon, analytics, the `SectionHeader` fix and canonical host. Collectively under two hours; every day they wait is pure loss.

### TypeScript gate — sequence it

`next.config.ts` currently sets `typescript.ignoreBuildErrors: true`. **Do not simply delete it** — it may be hiding a pile of errors that would block deploys.

- **M0:** typecheck runs in CI as a **non-blocking report** so we can see the size of the problem.
- **M1:** fix the errors, make it blocking, remove the flag. Deal with the `eslint.ignoreDuringBuilds` key in the same change.

### Canonical host — use `www`

Production already serves `www` and apex already 308s to it. Making canonicals, sitemap URLs and robots directives point at `www` is the smaller change and matches reality. Every indexed URL currently declaring a canonical that points away from itself is a live bug — fix in M0, not M5.

### The handbook is now committed

`docs/architecture/` — 13 markdown files, an index `README.md`, 30 diagrams. My earlier instruction to commit it went nowhere and you were designing from a brief that references it 19 times.

Read `docs/architecture/README.md` first. It states which five things carry into Phase 0 and which parts of the handbook are void. **The Response Envelope is §16, with a complete worked example in Appendix C (`12-appendices.md`).** Use those rather than designing from first principles.

### Still owed

The full list of what `UPDATE.md` gets wrong — including the two instructions you said would cost us SEO if followed literally. Summarise in chat at your next report.

## 6. What I'm gathering

| Item | Status | Gate |
|---|---|---|
| Lawyer — privacy, terms, DPA | Starting now | **Hard gate on M3.** No customer document is uploaded under a policy that describes a website. |
| 2–3 pilot hotels | Starting now | M4 cannot be accepted without them |
| My day labelling 40 retrieval pairs | Booked against M4 | M4 acceptance |
| Model provider, zero-retention | Starting now | M4 |
| Sending domain + SPF/DKIM | **Moved to M0** — contact form needs it | M0 |
| Managed Postgres | Verifying `CREATEROLE` first | M1 |
| Object storage, Redis | Not yet — MinIO locally | M3 |
| Google OAuth credentials | Not yet | M2 |
| Search Console | Not yet | M5 |

**On Postgres:** good catch and it's load-bearing. `UPDATE.md` §6.1 requires an application role without `BYPASSRLS` plus a separate migration role. A provider handing over a single near-superuser connection cannot satisfy that. **Verify against a trial instance** that both roles can be created and that RLS is actually enforced against the app role — do not take the documentation's word for it. Tell me which providers pass.
