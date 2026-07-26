# M0 kickoff prompt

Paste everything below the horizontal rule as your next message to Claude Code, from the repo root.

---

I've committed three things since your orientation session. Read them before doing anything:

1. **`DECISIONS.md`** (new, repo root) — my rulings on your audit. Highest authority in the repo.
2. **`docs/architecture/`** (new) — the architecture handbook you flagged as missing. 13 markdown files, start at `README.md`. Diagrams are Mermaid source in the files themselves.
3. **`AGENTS.md`** (updated) — project context, precedence order, non-negotiables. This loads automatically via `CLAUDE.md`, so it applies to every session from now on.

Precedence: `DECISIONS.md` > `UPDATE.md` > `docs/architecture/`.

## Headlines from DECISIONS.md

- **ADR-001 approved as you recommended** — build in place, npm workspaces, web stays on Vercel. One condition: add an explicit migration trigger to the ADR ("when a second JS app is added, or at the start of M4, whichever comes first") before you close it.
- **One engineer, working with you.** Timeline revised to 12–14 weeks. Working agreement in §2 — read it, it changes how we operate.
- **Analytics is Plausible or Umami, and it moves into M0.** You choose which; tell me.
- **Contact form goes to email now, a `leads` table in M1, the admin screen in M6.** My "send it to the admin dashboard" instruction, taken literally, meant a six-week leak. Corrected in §4.
- **You were right about M5.** It's a performance job, not a build. Rescoped in §5.
- **Four items pulled into M0**: favicon, analytics, the `SectionHeader` fix, canonical host.
- **Do not simply delete `typescript.ignoreBuildErrors`.** M0 adds typecheck to CI as a non-blocking report; M1 fixes and enforces. §5.

## Your task: M0 — stop the bleeding

Target 2–3 days. Every item independently shippable — ship as you finish, don't batch.

Branch `phase-0/m0`. Separate small commit per item. After each deploy, verify the site still renders and the Calendly path still works before moving on. Never commit to `main`.

| # | Item | Accepted when |
|---|---|---|
| 1 | **Contact form actually sends** | Submitting delivers email to the monitored inbox within seconds. A forced failure shows an error and a fallback address — never a false success. Honeypot + server-side rate limit. Verified end to end on production. |
| 2 | **Analytics live** | Plausible or Umami recording pageviews, contact submit, Calendly interaction, outbound clicks. Data visible from production traffic. |
| 3 | **Favicon fixed** | `src/app/icon.png` is currently 285 KB and is the heaviest request on every page. Under 15 KB, correct across browsers and the manifest. |
| 4 | **Heading fix** | `src/components/ui/SectionHeader.tsx` hardcodes `<h2>`. `/faq`, `/security`, `/company`, `/compare`, `/blog` each end with exactly one `<h1>`. Check every route — no page gains a second one. |
| 5 | **Canonical host** | Every canonical, sitemap URL and robots directive uses `www`. Apex still 308s to www. No URL declares a canonical pointing away from itself. |
| 6 | **CI exists** | GitHub Actions on every PR: install, build, typecheck (non-blocking, reporting the error count), lint. It does not have to pass — it has to run and be visible. |
| 7 | **Lighthouse baseline** | `docs/phase-0/BASELINE.md` — desktop and mobile scores plus LCP/INP/CLS for the five highest-value routes, dated. This is what M5 is measured against. |

### Out of scope for M0

The `"use client"` audit (M5 — needs CI first, and it's the change most likely to break something silently). Fixing the type errors (M1). Any dependency upgrade, content change, new page, or anything touching auth or the database.

### Report back with

1. Each of the seven items and how you verified it.
2. The typecheck error count from CI — I want to know the size of the M1 problem.
3. Whether any estimate of lost contact submissions was recoverable from Vercel logs.
4. **The full list of what `UPDATE.md` gets wrong**, including the two instructions you said would cost us SEO if followed literally. You owed me this from last session.
5. The `CREATEROLE` verification result if you got to it — which Postgres providers can create an app role without `BYPASSRLS` plus a separate migration role, verified against a real instance rather than documentation.

Then stop. M1 is the next session.
