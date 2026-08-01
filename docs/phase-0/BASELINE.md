# Performance: baseline and current

**Baseline taken:** 2026-07-27, end of M0, branch `phase-0/m0`
**Current measured:** 2026-08-02, `main`, end of M5
**Tool:** Lighthouse 13.x, headless Chrome, mobile emulation with 4× CPU throttling

The M5 bar, from `UPDATE.md` §10 and §12: **performance ≥ 90 and SEO ≥ 95 on
every marketing route**, mobile LCP ≤ 2.0 s, INP ≤ 200 ms, CLS ≤ 0.05.

---

## Current, measured against production

`https://www.soyl.cloud`, mobile. This is the environment the criterion
describes — a CDN, HTTP/2, real latency — and it differs enough from a loopback
measurement that both are recorded here.

| Route | Perf | A11y | Best prac. | SEO | LCP | CLS |
|---|---|---|---|---|---|---|
| `/` | **94** | 96 | 100 | **100** | 2.9 s | 0 |
| `/products/butler-ai` | **91** | 95 | 100 | **100** | 3.3 s | 0 |
| `/pricing` | **95** | 96 | 100 | **100** | 2.9 s | 0 |
| `/blog` | **98** | 94 | 100 | **100** | 2.3 s | 0 |
| `/book-demo` | **98** | 96 | 100 | **100** | 2.1 s | 0 |
| `/resources` | **98** | 96 | 100 | **100** | 2.2 s | 0 |
| `/resources/hotel-sop-checklist` | **99** | 96 | 100 | **100** | 2.1 s | 0 |
| `/legal/privacy` | **99** | 96 | 100 | **100** | 2.2 s | 0 |

**Met:** performance ≥ 90 and SEO ≥ 95 on every marketing route — §12's M5
acceptance criterion. Accessibility 94–96, up from 89. Best practices 100
everywhere, up from 77 on `/book-demo`. CLS 0.

**Not met:** LCP ≤ 2.0 s. It is 2.1–3.3 s: close on most routes, furthest on
`/products/butler-ai`.

### Warm the routes first — production too

The same trap as measuring locally, and worse. Taken immediately after a
deploy, `/products/butler-ai` scored **67** and `/blog` **76**. Warmed, the
same deploy measures **91** and **98**. A cold Vercel edge cache costs 20–30
points, which is more than any single change in this document is worth.

Warmed figures still move run to run — `/` measured 92, 94 and 98 within a few
minutes. Treat one number as ±5 and compare medians. The CI job runs each URL
three times for that reason.

## Before and after

Mobile, the five routes the original baseline tracked, both columns measured
the same way — a local production build — so they are comparable.

These were taken **before** the last two fixes (the `latin-ext` revert and the
above-the-fold reveal). They are kept because they isolate what the Calendly
facade and the animation-library removal were each worth. The current state is
the production table above.

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
one "not specified" cell in a comparison table. Upright only now, `latin`
subset only, with `display: optional`.

**One wrong turn worth recording.** Mid-M5 `latin-ext` was added to the subsets
on the theory that it would take a second font file off the critical chain. It
did the opposite: it doubled the *preloaded* bytes, from 48 KB to 132 KB, on
the one request that blocks first paint. Reverting it moved `/` from 88 to a
consistent 91 locally.

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

### 6. An above-the-fold image inside a scroll reveal ✅

Not on the original list, because it was introduced *during* M5. `Reveal`
starts at `opacity: 0` and becomes visible only once JavaScript has hydrated
and an IntersectionObserver has fired — so an above-the-fold image wrapped in
one has its LCP gated on hydration plus a 0.6 s transition.

That is what happened to `/products/butler-ai`: its LCP element was an `img`
inside `div.soyl-reveal`, and the route sat at 82 while everything else was
above 90. `priority` on the mockup components now means "this is above the
fold" and both eager-loads the image and skips the reveal. 82 → 92.

The general lesson is the same one the hero heading taught, applied to images:
anything in the first viewport must not be hidden behind an animation.

---

## The open item: LCP

**LCP is 2.1-3.3 s against a 2.0 s criterion.** Close on most routes, furthest
on `/products/butler-ai`.

### What this number actually is

Several hours went into chasing a "late repaint" that does not exist, so the
mechanism is worth stating plainly.

Lighthouse's default throttling is **simulated**, not applied. It observes the
page on a fast connection and then computes what the metrics *would* be on slow
4G, from a dependency graph. The two are different measurements, and mixing
them is what sent the investigation in circles:

- `lcp-breakdown-insight` reports **observed** timings. On `/legal/privacy`
  those are 16 ms TTFB and **147 ms element render delay**.
- The reported LCP for the same run is **2400 ms** - the simulated value.

So there is no mysterious repaint to find. LCP here is a function of **bytes on
the critical path**, and the fix is to move bytes off it - which is what the
font and reveal changes above did.

An A/B settled it: removing the webfont entirely took `/legal/privacy` from
LCP 3108 ms to 2400 ms and performance from ~93 to 98. That localises the
remaining cost to font transfer, not to swap behaviour, hydration or paint.

Ruled out with evidence: third-party scripts (only Plausible, 2 KB,
`lazyOnload`), layout shift (CLS 0), animation on the LCP element, and heavy
paints from the hero gradients.

### What is left to try

1. **Ship less font.** The preloaded `latin` subset is still 48 KB and is the
   largest single thing on the critical path. A self-hosted subset cut to the
   glyphs actually used would be a fraction of that. Highest-value remaining
   change and the most likely to close the gap.
2. **Ship less CSS.** 81 KB uncompressed, ~15 KB gzipped, render-blocking.
3. **Judge it on field data.** INP cannot be measured in a lab run at all, and
   Search Console now has real Core Web Vitals for this domain. Simulated slow
   4G is a conservative model; the field number is the one that affects
   ranking.

---

## The CI gate

`lighthouserc.json`, eight routes, three runs each, mobile with 4× CPU
throttling. Runs on every PR.

**Blocking, and passing today:** performance ≥ 90, SEO ≥ 95, accessibility
≥ 90, best practices ≥ 90, CLS ≤ 0.05, TBT ≤ 300 ms.

**Warning:** LCP ≤ 2000 ms — the one criterion still unmet.

Performance was a warning for most of M5 and became an error once every route
cleared 90. LCP stays a warning until the work above closes it; erroring now
would fail every PR for debt that predates it, which is the reasoning
`DECISIONS.md` §5 applied to lint in M0.

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
