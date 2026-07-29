# Performance: baseline and current

**Baseline taken:** 2026-07-27, end of M0, branch `phase-0/m0`
**Current measured:** 2026-07-29, `main`, mid-M5
**Tool:** Lighthouse 13.x, headless Chrome, mobile emulation with 4× CPU throttling

The M5 bar, from `UPDATE.md` §10 and §12: **performance ≥ 90 and SEO ≥ 95 on
every marketing route**, mobile LCP ≤ 2.0 s, INP ≤ 200 ms, CLS ≤ 0.05.

---

## Current, measured against production

`https://www.soyl.cloud`, mobile. This is the environment the criterion
describes — a CDN, HTTP/2, real latency — and it differs enough from a loopback
measurement that both are recorded here.

| Route | Perf | A11y | Best prac. | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `/` | **78** | 96 | 100 | **100** | 3.2 s | 0 | 480 ms |
| `/products/butler-ai` | **82** | 95 | 100 | **100** | 3.6 s | 0 | 330 ms |
| `/pricing` | **92** | 96 | 100 | **100** | 2.9 s | 0 | 200 ms |
| `/blog` | **84** | 94 | 100 | **100** | 4.0 s | 0 | 190 ms |
| `/book-demo` | **95** | 96 | 100 | **100** | 2.6 s | 0 | 160 ms |
| `/resources` | **91** | 96 | 100 | **100** | 2.7 s | 0 | 240 ms |
| `/legal/privacy` | **93** | 96 | 100 | **100** | 2.6 s | 0 | 230 ms |

**Met:** SEO 100 everywhere. Accessibility 94–96, up from 89. Best practices
100 everywhere, up from 77 on `/book-demo`. CLS 0, which was already true.

**Not met:** performance ≥ 90 on `/`, `/products/butler-ai` and `/blog`. LCP
≤ 2.0 s on any route.

Production figures move several points between runs — `/` measured 86 and then
78 twenty minutes apart with no deploy in between. Treat a single number as ±6
and compare medians. The CI job runs each URL three times for that reason.

## Before and after

Mobile, the five routes the original baseline tracked. Both columns are the
same method — a local production build — so they are comparable. Production is
the table above.

| Route | Perf | A11y | Best prac. | LCP |
|---|---|---|---|---|
| `/` | 82 → 88 | 89 → 96 | 100 → 100 | 4.1 s → 3.8 s |
| `/products/butler-ai` | 86 → 87 | 89 → 95 | 100 → 100 | 3.7 s → 3.9 s |
| `/pricing` | 82 → 91 | 89 → 96 | 100 → 100 | 3.9 s → 3.4 s |
| `/blog` | 82 → 90 | 89 → 94 | 100 → 100 | 4.4 s → 3.6 s |
| `/book-demo` | **57 → 93** | 89 → 96 | **77 → 100** | **16.8 s → 3.1 s** |

---

## What was done, in the baseline's priority order

### 1. `/book-demo` — the Calendly facade ✅

The baseline called this "worth more than the rest of M5 combined, because it
sits on the only working conversion path we have". It was pulling 3.77 MB —
Calendly's CSS and JS at 1.3 MB each, plus reCAPTCHA, Stripe and Google
Identity — before anyone could book, and every visitor who read the page and
left paid for all of it.

It now renders our own markup and loads the embed on click. Perf 57 → 95, best
practices 77 → 100, LCP 16.8 s → 2.6 s. The Calendly destination is unchanged
and the booking flow is verified after every deploy.

### 2. `"use client"` on marketing pages ✅

The home page was a client component for animation alone — no state, no
effects, no handlers. `Reveal` wraps sections instead, relying on children
passed from a server component to a client component staying server-rendered:
they go into the RSC payload, not the bundle.

The hero is deliberately **not** animated. An opacity transition on the LCP
element delays LCP by exactly the transition's duration, because the metric
measures when the element reaches its final painted state.

### 3. Two animation libraries ✅

Both gone from marketing. GSAP was one counter, now `IntersectionObserver` and
`requestAnimationFrame`. framer-motion was ~50 KB plus hydration cost on every
route to fade divs in and slide one menu panel; CSS transitions do it off the
main thread. **This is what moved the scores** — local TBT fell from 350 ms to
60–120 ms.

framer-motion still ships on `/app` and `/advisor`, which sit behind
interaction and are not measured against the marketing bar.

### 4. Fonts ✅

Inter was pulling two files totalling 132 KB, the largest resources on every
page once the JavaScript came down. The second was the italic face, loading for
one "not specified" cell in a comparison table. Upright only now, with
`display: optional`.

### 5. Accessibility ✅ 89 → 94–96

All three audits the baseline listed:

- `button-name` — the mobile menu button was an icon with no accessible name,
  announced as "button". Now labelled, with `aria-expanded` and
  `aria-controls`.
- `heading-order` — the footer jumped straight to `h4`. Those headings label
  navigation groups, so `h2` is both correct and skips nothing.
- `color-contrast` — `--color-soyl-gray-600` was `#6B7280`: 4.83:1 on white, a
  pass by a hair, and a fail on the gray-50 sections that are half the page.
  Now `#5B6472`, 5.98:1 on white and 5.72:1 on gray-50.

---

## The open item: LCP

**LCP is 2.6–4.0 s against a 2.0 s criterion, on every route.** It barely moved
despite everything above, and it is the one criterion none of that work fixed.

What is known, from the production trace of `/`:

- The LCP element is the hero `<h1>`. Text, not an image.
- Time to first byte is 99 ms. Element render delay is ~1.4 s.
- **The filmstrip shows the page visually complete at ~2.0 s**, then a tiny
  repaint around 3.0 s that moves LCP to 3.5 s. The screenshot payload changes
  by under 100 bytes between those two frames.

Ruled out, with evidence:

- **Third-party scripts.** Only Plausible loads: 2 KB, `lazyOnload`.
- **Layout shift.** CLS is 0.
- **The hero image.** Preloaded via `priority`, and it is not the LCP element.
- **Animation on the LCP element.** The hero is not animated at all.
- **Font swap.** `display: optional` commits to the fallback rather than
  swapping, and setting it changed nothing measurable.
- **Hero gradients.** One linear and one radial gradient; not a heavy paint.

Left to investigate:

1. Whether the ~3.0 s repaint is React hydration re-rendering the heading. TBT
   on production `/` is 480 ms against 60–120 ms locally, so the main thread is
   busier in production than the local build suggests — and 221 KB of JS still
   ships to a page whose primary content is now server-rendered.
2. Whether render-blocking CSS can be cut. Lighthouse estimates 390 ms of
   savings from the single 14.8 KB stylesheet.
3. Whether this should be judged on field data rather than in the lab. INP
   cannot be measured in a lab run at all, and Search Console will have real
   Core Web Vitals for this domain now that there is traffic.

The user-visible experience — FCP 1.3 s, visually complete at 2.0 s, CLS 0 — is
better than the LCP figure alone suggests. That is context, not an excuse. The
criterion says 2.0 s and it is not met.

---

## The CI gate

`lighthouserc.json`, eight routes, three runs each, mobile with 4× CPU
throttling. Runs on every PR.

**Blocking, and passing today:** SEO ≥ 95, accessibility ≥ 90, best practices
≥ 90, CLS ≤ 0.05, TBT ≤ 300 ms.

**Warning:** performance ≥ 90, LCP ≤ 2000 ms.

Those two are warnings because erroring would fail every PR for debt that
predates the PR — the reasoning `DECISIONS.md` §5 applied to lint in M0. **They
must become errors before M5 is signed off**, and the work is the list above.

---

## Reproducing this

```bash
npm run build
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=www.soyl.cloud npx next start -p 3113
```

Then, **warming each route before measuring it**:

```bash
curl -s -o /dev/null http://127.0.0.1:3113/<route>   # twice
npx lighthouse http://127.0.0.1:3113/<route> \
  --form-factor=mobile --screenEmulation.mobile --chrome-flags="--headless"
```

The warming step is not optional. `next start` compiles a route lazily on first
request even from a production build, and measuring cold was worth roughly 13
points during M5 — enough to make two runs of identical code disagree about
whether a route passed. Two measurement rounds in that session were invalid
before this was noticed.

Or, for the whole gate exactly as CI runs it:

```bash
npx @lhci/cli@0.15.x autorun
```
