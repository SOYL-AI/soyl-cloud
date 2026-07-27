# Phase 0 — Repository Audit

**Date:** 2026-07-26
**Branch:** `phase-0/orientation`
**Commit audited:** `a42d7cf` (+ uncommitted blog work, see §9)
**Method:** static read of the tree, production build, Lighthouse against the built output, live HTTP/DNS probes of `soyl.cloud`, full git-history secret scan.

---

## 1. Summary in one line

Next.js **16.2.9** App Router (Turbopack), React 19.2.4, TypeScript strict, npm, Tailwind v4, **zero backend** — 41 fully-prerendered static pages with all content hardcoded in TypeScript modules, deployed on Vercel from `SOYL-AI/soyl-cloud` via GitHub integration, served at **`https://www.soyl.cloud`** (apex 308-redirects to www).

---

## 2. Stack

| Concern | Actual |
|---|---|
| Framework | **Next.js 16.2.9**, App Router, **Turbopack** (default in 16) |
| React | 19.2.4 |
| Language | TypeScript 5.9.3, `strict: true`, target ES2017, `@/*` → `./src/*` |
| Package manager | **npm** (`package-lock.json`, lockfileVersion 3). No pnpm/yarn/bun artifacts. |
| Node | v22.20.0 local. No `.nvmrc`, no `engines` field — **unpinned**. |
| Styling | **Tailwind CSS v4** via `@tailwindcss/postcss` 4.3.1. CSS custom properties (`--color-soyl-*`) in `globals.css`. No `tailwind.config.*` — v4 CSS-first config. |
| Component library | **None.** Hand-rolled primitives in [src/components/ui/](src/components/ui/) (Button, Badge, Container, SectionHeader, AnimatedCounter). No shadcn/ui, no Radix. |
| Animation | **Two libraries**: `framer-motion` 12.40.0 *and* `gsap` 3.15.0 + `@gsap/react`. |
| Icons | `lucide-react` 1.21.0 |
| Utilities | `clsx`, `tailwind-merge` |
| Fonts | `next/font/google` — Inter, self-hosted at build |
| Tests | **None.** No test runner, no test files, no CI. |

**Note for the brief:** `Update.md` §5 specifies "Next.js 15 App Router … Tailwind v4, shadcn/ui, Motion". The repo is already on **16**, which is ahead of the brief, and has **no shadcn/ui**. See [PHASE-0-PLAN.md](PHASE-0-PLAN.md) §3.

---

## 3. Structure and routing

```
src/
  app/                    App Router — 15 static routes + 2 dynamic segments
    layout.tsx            root: metadata, Organization + WebSite JSON-LD, Navbar, Footer
    page.tsx              "use client"
    icon.png              favicon — 279 KB (see §7)
    robots.ts             generated
    sitemap.ts            generated
    not-found.tsx
    about|company|contact|faq|pricing|privacy|security|terms|book-demo/
                          each: page.tsx ("use client") + layout.tsx (metadata only)
    products/butler-ai|pms-lite|soyl-dine/
    blog/page.tsx, blog/[slug]/page.tsx        generateStaticParams — 7 posts
    compare/page.tsx, compare/[slug]/page.tsx  generateStaticParams — 16 competitors
  components/             ui/, sections/, compare/, seo/, mockups/ + 5 loose mockups
  lib/                    constants, blog-data, competitors, faq-data, animations, utils
```

### The `"use client"` situation — the most consequential structural fact

**25 of ~40 source files are `"use client"`, including nearly every top-level `page.tsx`**: `/`, `/about`, `/pricing`, `/contact`, `/privacy`, `/terms`, `/book-demo`, and all three product pages.

Because a Client Component cannot `export const metadata`, the codebase works around this with **sibling `layout.tsx` files that exist only to hold metadata** and return `children` untouched:

```tsx
// src/app/pricing/layout.tsx — the pattern, repeated 9 times
export const metadata: Metadata = { /* … */ };
export default function PricingLayout({ children }) { return children; }
```

This still prerenders to static HTML at build time, so SEO is not broken — but it means the marketing site ships its content inside client bundles and hydrates all of it. This is the direct cause of the mobile performance gap in §7, and it **contradicts `Update.md` §10's "Marketing routes are RSC with no client-side data fetching for primary content."**

`/blog/[slug]` and `/compare/[slug]` are correctly Server Components.

### Where content lives

**Hardcoded in TypeScript modules** — no CMS, no MDX, no database:

| File | LOC | Holds |
|---|---|---|
| [src/lib/competitors.ts](src/lib/competitors.ts) | 672 | 16 competitor comparison datasets |
| [src/lib/blog-data.ts](src/lib/blog-data.ts) | 274 | 7 posts as typed `ContentBlock[]` structures |
| [src/lib/faq-data.ts](src/lib/faq-data.ts) | 234 | FAQ entries feeding `FAQPage` JSON-LD |
| [src/lib/constants.ts](src/lib/constants.ts) | 29 | `COMPANY`, nav, legal, social links |

`blog-data.ts` is a genuinely well-designed structured content model (discriminated-union blocks), not prose-in-JSX. Publishing a post is a code change and a deploy.

### Build output

`next build` → 41 prerendered pages, **all `○ Static` or `● SSG`**. Compile 10.4s. No SSR, no ISR, no route handlers. The site could be a static export today.

---

## 4. Build and deploy

- **Build:** `npm run build` → `next build` (Turbopack).
- **Host:** **Vercel.** Confirmed live: `Server: Vercel`, `X-Vercel-Id: bom1::…` (**Mumbai** region), `X-Vercel-Cache: HIT`.
- **Trigger:** GitHub integration on [`SOYL-AI/soyl-cloud`](https://github.com/SOYL-AI/soyl-cloud), `main`. Push to `main` deploys production.
- **[vercel.json](vercel.json):** minimal — framework, build/install commands, `outputDirectory`. **No redirects, headers, rewrites, regions or crons.**
- **CI:** **none.** No `.github/workflows`. Vercel's build is the only gate.
- **Preview envs:** Vercel gives per-PR previews by default; no config commits it.

### ⚠️ The build gates are switched off

[next.config.ts](next.config.ts):

```ts
eslint:     { ignoreDuringBuilds: true },   // ← silently ignored: Next 16 REMOVED this key
typescript: { ignoreBuildErrors: true },    // ← honored: build prints "Skipping validation of types"
```

Two separate problems:

1. **`eslint.ignoreDuringBuilds` no longer exists in Next 16.** The build emits `⚠ Invalid next.config.ts options detected: Unrecognized key(s) in object: 'eslint'`. `next lint` was removed in 16; `next build` no longer lints at all. The key is dead config that should be deleted.
2. **`typescript.ignoreBuildErrors: true` is active.** Type errors ship to production. Added in `9eb8c99` ("ignore eslint and ts errors during build for vercel deployment") — a deadline workaround that was never reverted.

Current actual type state (`npx tsc --noEmit`): **the application source is clean.** The only errors are the dead `eslint` key in `next.config.ts` and three stale `.next/dev/types/validator.ts` references to routes that no longer exist (`/butler-ai`, `/pms-lite`, `/soyl-dine` — moved under `/products/`). Both are trivially fixable, which means **the escape hatch can be closed cheaply and should be, before any application code lands.**

---

## 5. Domain, DNS, TLS

| | |
|---|---|
| Apex `soyl.cloud` | `216.198.79.1` → **HTTP 308 → `https://www.soyl.cloud/`** |
| `www.soyl.cloud` | CNAME → `dbc155580506465f.vercel-dns-017.com` → `216.198.79.65`, `64.29.17.65` |
| **Production canonical host** | **`https://www.soyl.cloud`** |
| TLS | Vercel-managed. `Strict-Transport-Security: max-age=63072000` (2y, **no `includeSubDomains`, no `preload`**) |
| CDN | Vercel Edge, `bom1` |

### 🔴 Live SEO defect: canonical host mismatch

The code hardcodes the **apex** everywhere — `metadataBase`, every `alternates.canonical`, every sitemap `<loc>`, the `robots.txt` sitemap directive — all derived from `COMPANY.domain = "soyl.cloud"` in [src/lib/constants.ts:3](src/lib/constants.ts#L3). But production serves **www**.

Verified live:

```
https://www.soyl.cloud/            canonical → https://soyl.cloud      (308s away)
https://www.soyl.cloud/sitemap.xml <loc>     → https://soyl.cloud/…    (all 30+ URLs 308)
https://www.soyl.cloud/robots.txt  Sitemap:  → https://soyl.cloud/sitemap.xml
```

**Every indexed URL declares a canonical pointing at a hostname that redirects away from itself.** Google generally resolves this, but it wastes crawl budget, splits signals on a young domain, and is exactly the `www`/non-`www` split `Update.md` §10 forbids. One-line fix once the host decision is made — **but the decision is yours** (see [RISKS.md](RISKS.md) §2, Decision 1).

---

## 6. Existing backend surface

**There is none.** This is the cleanest finding in the audit and it is good news for Phase 0.

| Surface | Present? |
|---|---|
| Route handlers (`route.ts`) / `app/api/` | **None** |
| Server Actions | **None** |
| `proxy.ts` / `middleware.ts` | **None** |
| `process.env` anywhere in `src/` | **None** |
| Database, ORM, migrations | **None** |
| Auth, sessions, cookies | **None** |
| Email / transactional sending | **None** |
| Analytics (GA, Plausible, PostHog, …) | **None** |
| Third-party scripts | **One:** Calendly `<iframe>` on [/book-demo](src/app/book-demo/page.tsx#L24) → `calendly.com/siddharthpriyatam/30min` |

### 🔴 The contact form is not connected to anything

[src/app/contact/page.tsx:14-23](src/app/contact/page.tsx#L14-L23):

```tsx
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  // Simulate submission for MVP
  setTimeout(() => { setIsSubmitting(false); setSubmitted(true); }, 1000);
};
```

It waits one second, shows the user a success state, and **discards the submission**. No network call, no destination. Any inbound lead through `/contact` since launch has been silently lost, and the visitor was told it went through.

This is a business problem, not a technical one, and it is independent of Phase 0. Flagged as the highest-priority pre-M1 fix in [PHASE-0-PLAN.md](PHASE-0-PLAN.md) §2.

The only working conversion path today is the Calendly iframe on `/book-demo` and the `mailto:` link on `/contact`.

---

## 7. SEO and performance baseline

### What is already done well

Genuinely more mature than a typical pre-seed marketing site:

- `sitemap.ts` and `robots.ts` — **generated, not hand-maintained** (as §10 requires), covering static, legal, 16 comparison and 7 blog routes.
- Per-page `title` + `description` via the Metadata API, with a `%s | SOYL Cloud` template.
- **Per-page canonical on every route** (correct paths; wrong host — §5).
- OpenGraph + Twitter `summary_large_image`, `metadataBase`, 1200×630 OG image.
- Extensive JSON-LD: `Organization` + `WebSite`+`SearchAction` site-wide; `Product`/`SoftwareApplication`, `FAQPage`, `WebPage`, `BreadcrumbList` via [SchemaInjector.tsx](src/components/seo/SchemaInjector.tsx). Lighthouse `structured-data` passes on all routes sampled.
- Skip-to-content link in the root layout.
- All content images go through `next/image` (AVIF/WebP configured) — the `/_next/image` transform is working: a 790 KB hero PNG is served as **36 KB**.

### Lighthouse — measured baseline

Run against `next start` on the production build. **Desktop preset:**

| Route | Perf | A11y | Best-prac | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `/` | 94 | 94 | 100 | **100** | 1.5 s | 0 | 10 ms |
| `/pricing` | 99 | 95 | 100 | **100** | 0.9 s | 0 | 0 ms |
| `/products/butler-ai` | 96 | 95 | 100 | **100** | 1.4 s | 0 | 10 ms |
| `/blog` | 99 | 94 | 100 | **100** | 1.0 s | 0 | 10 ms |

**Mobile preset (`/` only):**

| Perf | A11y | SEO | LCP | CLS | TBT | Speed Index |
|---|---|---|---|---|---|---|
| **71** | 89 | **100** | **5.6 s** | 0 | 290 ms | 4.0 s |

**Read this carefully against the M5 acceptance criteria.** `Update.md` M5 requires "Lighthouse ≥ 95 SEO and ≥ 90 performance for every marketing route", and §10 sets LCP ≤ 2.0s. On desktop that is already met. **On mobile the home page is at 71 with a 5.6s LCP** — and mobile is what Google's Core Web Vitals actually score. M5 is not a formality.

### Defects found

1. **🔴 The favicon is 279 KB.** [src/app/icon.png](src/app/icon.png) is a full-size PNG served as `/icon.png` on **every page**. Lighthouse ranks it the single heaviest request on the mobile home page — heavier than the fonts (84 KB + 48 KB), heavier than the largest JS chunk (70 KB), and **8× heavier than the optimized hero image (36 KB)**. Introduced by `77e1c22` ("Use logo as favicon"). Highest effort-to-impact fix in the repo.

2. **🔴 Five routes have no `<h1>`.** Verified by parsing the rendered HTML:

   | Route | Top heading |
   |---|---|
   | `/faq` | starts at `h2` |
   | `/security` | starts at `h2` |
   | `/company` | starts at `h2` |
   | `/compare` | starts at `h2` |
   | `/blog` | starts at `h3` |

   **Single root cause:** [SectionHeader.tsx:40](src/components/ui/SectionHeader.tsx#L40) hardcodes `<h2>`, and these five pages use it as their page title. Violates §10's "one `h1` per page". Fix is one `as` prop on one component.

3. **Mobile a11y 89** — failing audits: `button-name` (unlabelled icon buttons), `color-contrast`, `heading-order` (a consequence of #2).

4. **Two animation libraries** — `framer-motion` (12.40.0) and `gsap` + `@gsap/react` both ship. Combined with universal `"use client"`, this drives the 290 ms TBT and 76 KB of unused JS. `Update.md` §5 specifies Motion only.

5. **HSTS lacks `includeSubDomains` and `preload`**; no `Content-Security-Policy`, `X-Frame-Options`, `Referrer-Policy` or `Permissions-Policy` — no `headers` block in `vercel.json` or `next.config.ts`. Acceptable for a brochure site; **not acceptable once authenticated sessions and customer documents exist.**

6. **`hreflang`:** correctly absent. §10 says don't add it speculatively. Nothing to do.

---

## 8. Environment and secrets

**Clean.** Nothing sensitive is committed.

- Full history scanned — all 24 commits, all branches, added-file names and blob contents, for `sk-*`, `AKIA*`, `-----BEGIN`, and `.env`/`secret`/`credential`/`.pem`/`key` filenames. **Zero hits.**
- `.env*` is gitignored ([.gitignore:34](.gitignore#L34)). No `.env` file exists in the working tree.
- **No environment variables are used at all** — no `process.env` reference anywhere in `src/`. There is nothing configured in Vercel that the code reads.
- Public contact details are intentionally in source ([constants.ts](src/lib/constants.ts)): `ryan.gomez@soyl.cloud`, `+91 7022509965`, Bengaluru address. Also embedded in `Organization` JSON-LD. Deliberate, not a leak.

**Implication for M1:** env-var handling starts from zero. No legacy secrets to rotate or migrate — a real advantage.

---

## 9. Repository health

| Item | State |
|---|---|
| Tracked files | 137 |
| Commits | 24, single `main`, no tags, no releases |
| Working tree | **Dirty** — see below |
| `public/` weight | **28 MB**, ~60 PNGs, 15 of them ≥ 700 KB |
| Committed artifact | **`lint_output.txt`** (9.3 KB) is tracked and should not be. `tsconfig.tsbuildinfo` and `next-env.d.ts` are present but correctly gitignored. |
| Filenames | Several assets contain **spaces and trailing spaces** — `public/images/products_pics/Butelr new image .png`, `Butler AI new OPs console .png`, `New PMS pic 5 .png`. Also a typo (`Butelr`). Fragile across tooling and case-sensitive CI filesystems. |
| Line endings | No `.gitattributes`; git warns `LF will be replaced by CRLF`. Will cause spurious diffs across machines. |

### Uncommitted work in progress — **do not disturb**

```
 M src/app/blog/[slug]/page.tsx   (+54 lines)
 M src/lib/blog-data.ts           (+89 lines)
?? public/images/blog/connected_data.png
?? public/images/blog/hotel_timing_hero.png
?? public/images/blog/personalized_offers.png
?? UPDATE.md
```

An in-flight blog post with new imagery. It was present before this session and has been carried onto `phase-0/orientation` untouched.

### Dependency health

`npm audit --omit=dev`: **3 high-severity vulnerabilities**, all transitive through `next@16.2.9`:

- **`sharp` < 0.35.0** — inherited `libvips` CVEs: `CVE-2026-33327`, `CVE-2026-33328`, `CVE-2026-35590`, `CVE-2026-35591`. `sharp` is the image-optimization path, which **this site uses on every page**.
- **`postcss`** (under `next`).

**Both are fixed in `next@16.2.12`** — a patch bump within the same minor. Everything else is current or one patch behind (`framer-motion` 12.40.0 → 12.42.2, `lucide-react` 1.21.0 → 1.27.0, `tailwindcss` 4.3.1 → 4.3.3, `react` 19.2.4 → 19.2.8). No dependency is meaningfully stale. `@types/node` is pinned to v20 while Node 22 is in use — a minor mismatch.

No dead code of consequence, with one exception: [src/components/BrowserMockup.tsx](src/components/BrowserMockup.tsx) and [src/components/mockups/BrowserMockup.tsx](src/components/mockups/BrowserMockup.tsx) are **two different components with the same name** in different directories.

---

## 10. Content inventory

All 41 routes. Traffic column is inferred from sitemap priority and internal linking — **there is no analytics on this site, so real traffic is unknown** (see [RISKS.md](RISKS.md) §2, Decision 3).

| Route | Description | Likely traffic |
|---|---|---|
| `/` | Home — AI concierge promise, metrics strip, industries, CTA | **Highest.** Priority 1.0 |
| `/products/butler-ai` | Butler AI — flagship AI concierge (404 LOC, largest page) | **High.** Primary product |
| `/products/pms-lite` | PMS Lite — property management, OTA integrations, pricing table | **High** |
| `/products/soyl-dine` | SOYL Dine — restaurant/QR ordering/kitchen display | Medium |
| `/pricing` | Plans and tiers | **High.** Conversion-adjacent |
| `/book-demo` | Calendly iframe | **Conversion endpoint.** Priority 0.9 |
| `/contact` | Contact form (**non-functional**, §6) + details | Medium. **Conversion endpoint** |
| `/about` | Company story, team image | Medium |
| `/company` | Company info | Low. Priority 0.3 |
| `/blog` | Blog index, 7 posts | Growing. **No `h1`** |
| `/blog/[slug]` × 7 | Full articles, structured content blocks | **SEO engine.** Server-rendered ✓ |
| `/compare` | Comparison hub | **No `h1`** |
| `/compare/[slug]` × 16 | vs. HiJiffy, Canary, Duve, +13 | **Deliberate SEO play.** Priority 0.9 |
| `/faq` | FAQ + `FAQPage` JSON-LD | Medium. **No `h1`** |
| `/security` | Security & compliance claims | Low. **No `h1`** |
| `/privacy` | Privacy policy — **~350 words, generic template** | Low |
| `/terms` | Terms of service — **~300 words, generic template** | Low |
| `/not-found` | 404 | — |

### 🔴 Two content-level findings that affect Phase 0 directly

**a) The legal pages are placeholders, and Phase 0 cannot ship on them.**

[/privacy](src/app/privacy/page.tsx) is 58 lines of generic GDPR boilerplate ("Identity Data", "Contact Data", "Technical Data"). It describes a **brochure website**. It says nothing about: hosting customer documents, sending customer content to a third-party model provider, sub-processors, data residency, retention, or deletion. There is **no `/legal/dpa` at all**.

`Update.md` §10 is explicit — legal pages are "required before any customer uploads a document. Not optional." Phase 0's entire premise is hotels uploading their SOPs and contracts. **These pages are a hard blocker on M3, and they are a lawyer task, not an engineering task.** Longest lead time of anything in this audit — flagged in [RISKS.md](RISKS.md) §2.

Minor bug while we're here: `/privacy` and `/terms` render "Last updated: {new Date().toLocaleDateString()}" — a build-time date that silently changes on every deploy, formatted in the server's locale. A legal document should carry a fixed, deliberate revision date.

**b) The live site markets a product line that Phase 0 contradicts.**

The site sells **three shipped-sounding products** — Butler AI (guest-facing AI concierge), PMS Lite (property management with OTA integrations, ADR/RevPAR analytics), SOYL Dine (restaurant POS) — with 16 competitor comparison pages positioning Butler AI against guest-messaging vendors, and detailed UI screenshots throughout.

Phase 0 builds something **materially different**: an internal-facing, document-grounded Q&A advisor for hotel *owners*. And `Update.md` §4 explicitly puts "PMS, booking engine, accounting or any external integrations" and "occupancy/ADR/RevPAR computation" **out of scope** — both of which `/products/pms-lite` currently advertises as features.

This is a **product/positioning decision, not an engineering one**, so I am flagging rather than resolving it. It is Decision 2 in [RISKS.md](RISKS.md) §2, and it determines how much of M5 is "new pages" versus "rewrite the site's story."

---

## 11. Open questions the repo cannot answer

1. Who owns the Vercel account and the `soyl.cloud` registrar/DNS?
2. Is there an existing Google Search Console property, and is the sitemap submitted? If so, under apex or www?
3. Does the site receive meaningful traffic today? **Unknowable — no analytics is installed.**
4. Are Butler AI / PMS Lite / SOYL Dine shipped products with real customers, prototypes, or positioning? This changes the answer to Decision 2.
5. Are the `/security` page's claims (AES-256, GDPR compliance, RBAC) contractual commitments already made to anyone?
6. Is the Calendly account (`siddharthpriyatam`) the right long-term demo destination?
7. Were any leads expected from `/contact`? If so, how many have been lost, and since when?

---

## 12. What this means for Phase 0 — the short version

**Good news:**
- Modern stack, already ahead of the brief's target version. No migration debt.
- Zero backend surface — nothing to unpick, no legacy auth, no secrets to rotate.
- SEO scaffolding (generated sitemap/robots, per-page metadata, JSON-LD) is genuinely good and worth keeping.
- All routes static → **adding authenticated dynamic routes cannot slow down or destabilise the marketing site.**

**Bad news:**
- Type checking is disabled at build time.
- No CI, no tests, no analytics — three of Phase 0's non-negotiables start from nothing.
- Legal pages are a hard blocker on M3 with the longest lead time in the project.
- Universal `"use client"` conflicts with the brief's RSC requirement and is the cause of mobile perf 71.
- The live site's product story and Phase 0's product story do not currently match.

Continue to [ADR-001](ADR-001-repo-structure.md), [PHASE-0-PLAN.md](PHASE-0-PLAN.md), [RISKS.md](RISKS.md).
