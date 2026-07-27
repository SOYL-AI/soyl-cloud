# Performance baseline

**Date:** 2026-07-27
**Branch:** `phase-0/m0` at the end of M0
**Tool:** Lighthouse 13.4.1, headless Chrome
**Method:** `npm run build && next start`, measured over loopback — the same method as the pre-M0 numbers in [REPO-AUDIT.md](REPO-AUDIT.md) §7, so the two are comparable. Analytics enabled (`NEXT_PUBLIC_PLAUSIBLE_DOMAIN` set), as production will be.

**This is what M5 is measured against.** The M5 bar, from `UPDATE.md` §10 and §12: performance ≥ 90 and SEO ≥ 95 on every marketing route, mobile LCP ≤ 2.0 s, INP ≤ 200 ms, CLS ≤ 0.05.

---

## Routes measured

The five that carry the business: the home page, the flagship product page, the two conversion endpoints, and the SEO engine's index.

## Desktop

| Route | Perf | A11y | Best prac. | SEO | LCP | CLS | TBT | FCP | Speed Index |
|---|---|---|---|---|---|---|---|---|---|
| `/` | 96 | 94 | 100 | **100** | 1.3 s | 0 | 10 ms | 0.4 s | 1.0 s |
| `/products/butler-ai` | 98 | 95 | 100 | **100** | 1.1 s | 0 | 10 ms | 0.4 s | 0.9 s |
| `/pricing` | 100 | 95 | 100 | **100** | 0.7 s | 0 | 10 ms | 0.4 s | 0.7 s |
| `/blog` | 100 | 94 | 100 | **100** | 0.7 s | 0 | 10 ms | 0.4 s | 0.7 s |
| `/book-demo` | 98 | 95 | **77** | **100** | 0.9 s | 0 | 0 ms | 0.9 s | 0.9 s |

Desktop already clears the M5 bar everywhere except `/book-demo`'s best-practices score.

## Mobile

Mobile is what Google's Core Web Vitals actually score. This is the real gap.

| Route | Perf | A11y | Best prac. | SEO | LCP | CLS | TBT | FCP | Speed Index |
|---|---|---|---|---|---|---|---|---|---|
| `/` | **82** | 89 | 100 | **100** | **4.1 s** | 0 | 170 ms | 1.7 s | 3.8 s |
| `/products/butler-ai` | **86** | 89 | 100 | **100** | **3.7 s** | 0 | 140 ms | 1.5 s | 3.5 s |
| `/pricing` | **82** | 89 | 100 | **100** | **3.9 s** | 0 | 260 ms | 1.7 s | 2.8 s |
| `/blog` | **82** | 89 | 100 | **100** | **4.4 s** | 0 | 150 ms | 1.5 s | 3.1 s |
| `/book-demo` | **57** | 89 | **77** | **100** | **16.8 s** | 0 | 0 ms | 8.2 s | 8.2 s |

**Not one mobile route meets the ≥ 90 performance bar, and not one meets LCP ≤ 2.0 s.** CLS is 0 everywhere and has been from the start — that criterion is already met and needs no work.

### On INP

Lighthouse cannot measure INP in a lab run; INP needs field data. **TBT is the lab proxy** and is what the tables above report. Real INP will only be available once Plausible (or Search Console's Core Web Vitals report) has accumulated production traffic — which is now possible for the first time, and is a reason not to defer the Search Console submission to the end of M5.

---

## Live production, for reference

Measured against `https://www.soyl.cloud/` on the same day, **before M0 reached production**. This is the pre-M0 code on Vercel's CDN.

> Since these were taken, pushing `phase-0/m0` deployed it — that Vercel project promotes any pushed branch to the production domain, not just `main`. Re-measure production before M5 starts; do not treat the 71 below as current.

| | Perf | A11y | Best prac. | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Home, mobile | **71** | 89 | 100 | 100 | 4.9 s | 0 | 400 ms |
| Home, desktop | 98 | 94 | 100 | 100 | 1.0 s | 0 | 10 ms |

Production mobile at 71 matches the audit's pre-M0 measurement exactly. The local M0 build measures 82 by the same method the audit used to measure 71 — **roughly +11 points on the mobile home page, from deleting a 285 KB favicon and nothing else.** Treat the exact delta as indicative: Lighthouse varies a few points run to run.

---

## What is actually costing us, in priority order

Measured, not guessed. This is M5's work list.

### 1. `/book-demo` is the slowest page on the site and it is the conversion endpoint

Mobile LCP **16.8 s**. The page itself is trivial; the Calendly iframe pulls **3.77 MB** before the visitor can book:

| Resource | Transfer |
|---|---|
| `assets.calendly.com/.../booking-*.css` | 1.30 MB |
| `assets.calendly.com/.../booking-*.js` | 1.29 MB |
| `gstatic.com/recaptcha/...` | 383 KB |
| `js.stripe.com/v3` | 240 KB |
| `assets.calendly.com/pxwebj3qd.js` | 129 KB |
| `accounts.google.com/gsi/client` | 99 KB |

It also drags best practices to 77 on both form factors.

**The fix is a facade:** render our own button and load the Calendly embed on click. Nothing loads for a visitor who bounces, and the LCP becomes our own markup. This is the single highest-value performance change available and it is worth more than the rest of M5 combined, because it sits on the only working conversion path we have.

Do not remove the iframe or change the Calendly destination — the booking flow must keep working, and it is verified after every deploy.

### 2. `"use client"` on nearly every `page.tsx` — 76 KB of unused JavaScript on the home page

25 files, including the top-level page component of almost every route (REPO-AUDIT.md §3). The content prerenders, so SEO is unaffected, but every route ships and hydrates its content as a client bundle. Heaviest scripts on the mobile home page: 71 KB, 45 KB, 41 KB, 40 KB.

`UPDATE.md` §10 requires marketing routes to be RSC with no client-side data fetching for primary content. **Route by route, with before/after numbers from this table, and only now that CI exists** (DECISIONS.md §5). It is the change most likely to break something silently.

### 3. Two animation libraries

`framer-motion` 12.40.0 and `gsap` 3.15.0 + `@gsap/react` both ship. Keep whichever is doing more work.

### 4. Fonts — 134 KB on the home page

Two `next/font` woff2 files at 86 KB and 49 KB, the heaviest single resources after JavaScript. Subsetting or dropping a weight is cheap.

### 5. Accessibility sits at 89 on mobile, 94–95 on desktop

Three failing audits on every route: `button-name` (unlabelled icon buttons), `color-contrast`, `heading-order`. The `<h1>` defect M0 fixed was a *different* problem — `heading-order` is about skipped levels within pages and is still open.

---

## Reproducing this

```bash
npm run build
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=www.soyl.cloud npx next start -p 3113

# desktop
npx lighthouse http://localhost:3113/ --preset=desktop --chrome-flags="--headless=new"
# mobile (Lighthouse's default preset)
npx lighthouse http://localhost:3113/ --chrome-flags="--headless=new"
```

Routes: `/`, `/products/butler-ai`, `/pricing`, `/blog`, `/book-demo`.

Lighthouse is deliberately **not** in CI yet. It belongs there as a budget gate, but a flaky performance gate on a repo whose CI is one day old would train us to ignore CI. Add it in M5 when there are numbers worth defending.
