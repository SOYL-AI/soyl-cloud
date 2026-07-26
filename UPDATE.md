# SOYL Phase 0 — Master Build Prompt

**How to use this.** Paste the whole thing as the opening message to Claude Code (or an equivalent agent) in an empty repository. Keep `SOYL-AI-Hotel-Operating-System-Architecture-Handbook.docx` in the repo at `docs/architecture/` so the agent can consult it — this prompt references it by section.

**Do not ask the agent to build all six milestones in one run.** Give it this prompt for context, then work milestone by milestone. Each milestone below has acceptance criteria; do not move on until they pass. The prompt is written so an agent can hold the whole shape in mind while executing one part at a time.

---

## 1. Who you are and what we are building

You are the founding engineer on SOYL, an AI operating system for hotels. You are working with a team of two to three people. Your judgement is trusted, but you are expected to say when something in this brief is wrong rather than build it anyway.

The long-term product is an intelligence layer that answers hotel owners' business questions and renders the answers as live interfaces — dashboards, charts, KPI cards, action plans — rather than as prose. The full architecture is in `docs/architecture/`. **You are not building that today.**

Today you are building **Phase 0**: the smallest complete product that (a) tells us whether hotel owners want this, (b) captures the questions they actually ask, and (c) accumulates a real document corpus so the AI can answer as an advisor grounded in their own material rather than as a generic chatbot.

Those three outcomes come from one build: a hotel signs up, uploads their documents, asks questions, and gets answers with citations.

## 2. Starting position — read this carefully

`soyl.cloud` is currently **a marketing site only**. There are no user accounts, no login, no application, no database of record. This is a greenfield build.

The architecture handbook assumes integration with an existing authenticated platform. That assumption is void. Where the handbook says "reuse the existing session" or "the existing tenancy model", you are building it.

Everything else in the handbook still holds and should be followed where this prompt does not override it.

## 3. What success looks like

At the end of Phase 0, a hotel owner can:

1. Land on soyl.cloud, understand in under ten seconds what this is, and sign up.
2. Create a property and upload their SOPs, policies, contracts, menus and rate sheets.
3. Ask, in plain language: *"What's our cancellation policy for corporate bookings?"* or *"What did we agree with the laundry vendor about turnaround time?"*
4. Get an answer that cites the exact document and section, with the source excerpt one click away.
5. Come back next week and have it still work.

And we can:

6. See every question ever asked, per tenant, exportable.
7. See signup funnel, activation (uploaded a document), and retention (asked a question in week 2).
8. Read any answer the system gave alongside the chunks it used, to judge whether it was good.

**If you build nothing else, build the loop in 3–4 and the capture in 6–8.** Everything else is supporting structure.

## 4. Scope

### In scope

| # | Surface | What |
|---|---|---|
| 1 | **Marketing site** | New landing page, product page, pricing placeholder, about, blog/resources scaffold. Server-rendered, fast, SEO-complete. |
| 2 | **Auth** | Email + password and Google OAuth. Email verification. Password reset. Session management. |
| 3 | **Onboarding** | Create tenant → create first property → upload first documents. Must be completable in under five minutes. |
| 4 | **Knowledge base** | Document upload, ingestion pipeline, chunking, embedding, retrieval, hybrid search. |
| 5 | **Ask surface** | The conversational surface. Streamed, structured answers with citations. |
| 6 | **Admin panel** | Internal only. Tenants, users, documents, every question asked, every answer given with its retrieved chunks, basic funnel metrics. |

### Explicitly out of scope — do not build these

- PMS, booking engine, accounting or any external integrations
- The metrics engine, `fact.*` tables, occupancy/ADR/RevPAR computation
- Charts of any kind. Phase 0 answers are text, citations and lists.
- LangGraph, multi-agent routing, planner/reflect nodes
- Spaces, pinning, `refresh_spec` execution
- Semantic memory, learned facts
- Azure. Deploy to Railway or Vercel + a managed Postgres.
- ClickHouse. Events go to Postgres.
- Payments and billing
- Mobile app
- Anything from Phases 3–6 of the handbook

If you find yourself building something on the out-of-scope list because it "would be easy to add", stop and flag it instead.

## 5. Stack

Follow the handbook's stack decisions, simplified for this phase.

**Web** — Next.js 15 App Router, TypeScript strict, Tailwind v4, shadcn/ui, Motion. One app serving both the marketing site and the authenticated product. No ECharts yet — no charts in Phase 0.

**Auth** — Auth.js (NextAuth) in the Next.js app, Postgres adapter, httpOnly Secure SameSite=Lax session cookie. The Next.js server exchanges the session for a short-lived signed JWT when calling the API, per handbook §23.1. Argon2id for password hashing.

**API** — Python 3.12, FastAPI, async throughout, SQLAlchemy 2.x async, Alembic, Pydantic v2, `uv` for dependencies. Layered per handbook §21, but only the modules this phase needs: `identity`, `property`, `rag`, `ai`.

**Database** — PostgreSQL 16 with `pgvector`. Row-level security from migration 001, no exceptions.

**Queue** — ARQ with Redis for document ingestion. Ingestion must not run in the request path.

**Storage** — S3-compatible object storage (Cloudflare R2 or Railway volumes). Access it only through a `StoragePort` interface with a single adapter, so the Azure Blob switch later is one file. This is the one abstraction worth writing early.

**Models** — Provider abstraction per handbook §35 from the first call. No file outside `soyl/infrastructure/providers/` may import a provider SDK; enforce it with `import-linter` in CI. Phase 0 uses one provider, but the seam exists.

**Deploy** — Railway. Web, API and worker as three services. Postgres and Redis managed. Preview environments per PR if the plan supports it.

**Monorepo** — pnpm + Turborepo. `apps/web`, `services/api`, `services/worker`, `packages/contracts`.

## 6. Non-negotiables

These are cheap now and expensive to retrofit. Do not defer them, and do not let scope pressure remove them.

1. **Row-level security in migration 001.** Every tenant-scoped table has `tenant_id`, has RLS enabled and forced, and has a policy keyed to `current_setting('app.tenant_id', TRUE)`. The application connects as a role without `BYPASSRLS`. Migrations use a separate role. Handbook §48.7.

2. **A tenant isolation test suite that cannot be skipped in CI.** For every repository method, prove tenant B cannot read tenant A's rows. Handbook §28.3.

3. **The Response Envelope.** Answers are structured JSON, not markdown strings, from the first answer the system ever gives. Phase 0 needs only four block types: `text.markdown`, `doc.citation`, `list.checklist`, `alert.callout`. The schema lives in Pydantic, is generated to Zod and TypeScript in `packages/contracts`, and the frontend validates every block before rendering. Handbook §16, §17.4.

4. **Provenance on every claim.** Every factual statement in an answer references a retrieved chunk ID. The validation stage strips unprovenanced claims before the answer reaches the user and logs the strip. This is the entire reason the product will be trusted. Handbook §33.4.

5. **Every question is logged, permanently.** Question text, resolved tenant, timestamp, retrieved chunk IDs and scores, the envelope returned, latency, token counts, and any user feedback. This is simultaneously the demand data, the eval corpus and the roadmap input. It is the single most valuable artifact Phase 0 produces.

6. **The usage ledger from the first model call.** `billing.usage_ledger` per handbook §34.3. Every model call writes a row with tokens and cost. We need to know what a customer costs before we price.

7. **`no-store, no-transform` on every streaming response**, and HTTP/2 at the edge. A proxy that buffers the stream destroys the experience. Handbook §24.2.

8. **PII minimisation before inference.** Guest names, emails and phone numbers are stripped or pseudonymised before any content reaches a model. Handbook §58.5.

## 7. Data model

Only these tables in Phase 0. Follow the handbook's DDL style and constraints; drop columns that only serve later phases.

```
core.tenant              id, name, slug, country, timezone, base_currency,
                         fiscal_year_start_month, status, settings, created_at, deleted_at
core.property            id, tenant_id, name, address, timezone, currency,
                         rooms_total, rooms_sellable, segment, status, created_at, deleted_at
core.user_account        id, email (citext unique), display_name, password_hash,
                         email_verified_at, locale, status, created_at, deleted_at
core.membership          id, tenant_id, user_id, role, property_scope, created_at
core.membership_property membership_id, property_id

rag.document             id, tenant_id, property_ids[], title, doc_type, language,
                         blob_uri, checksum, page_count, effective_from, expires_on,
                         supersedes, sensitivity, status, metadata, created_at, deleted_at
rag.chunk                id, document_id, tenant_id, property_ids[], ordinal,
                         heading_path[], content, context_header, summary, keywords[],
                         doc_type, effective_from, expires_on, token_count,
                         embedding vector(1536), embedding_model, content_tsv, created_at
rag.chunk_question       id, chunk_id, tenant_id, question, embedding vector(1536)
rag.ingestion_job        id, document_id, tenant_id, status, stage, error, created_at, updated_at

ai.conversation          id, tenant_id, user_id, title, turn_count, last_turn_at,
                         created_at, archived_at, deleted_at
ai.turn                  id, conversation_id, tenant_id, user_id, input, status,
                         envelope_id, trace_id, usage, started_at, completed_at,
                         idempotency_key
ai.envelope              id, tenant_id, turn_id, version, body jsonb, size_bytes, created_at
ai.retrieval_log         id, turn_id, tenant_id, query, filters, chunk_ids[], scores[],
                         reranked bool, latency_ms, created_at
ai.feedback              id, tenant_id, user_id, target_kind, target_id, envelope_id,
                         signal, reasons[], correction, created_at

billing.usage_ledger     id, occurred_at, tenant_id, user_id, turn_id, kind, provider,
                         model, input_tokens, output_tokens, cached_tokens,
                         cost_inr, PRIMARY KEY (id, occurred_at)  -- partitioned monthly

audit.log                id, occurred_at, tenant_id, actor_kind, actor_id, action,
                         resource_kind, resource_id, outcome, ip, user_agent,
                         trace_id, before, after  -- partitioned monthly

analytics.event          id, occurred_at, tenant_id, user_id, session_id, event_name,
                         source, properties jsonb
```

`ai.retrieval_log` is not optional. Without it you cannot answer "why did it give that answer", which is the question you will be asked most often.

## 8. The RAG pipeline

This is the technical heart of Phase 0. Build it properly — a mediocre retrieval pipeline produces a product that feels like a random-answer generator, which is exactly what we are trying not to be.

Follow handbook Part VII in full. The parts that matter most and are most often skipped:

**Extraction.** Digital-native PDFs through `pymupdf`. Scanned or layout-complex documents through a layout-aware OCR service. Do not lose table structure — a supplier rate card that loses its table is worthless.

**Chunking is structure-first, not fixed-size.** Split on heading hierarchy, numbered clauses and list boundaries. Merge small siblings. Never split a table. Attach the heading path to every chunk. Handbook §43.1.

**Contextual enrichment is mandatory.** Every chunk is embedded with a prepended context header naming the document, its validity, and the section path. This is the single highest-impact retrieval improvement available and it costs almost nothing:

```
Document: Guest Complaint Handling SOP (v4, effective 2026-01-15)
Property: All properties
Section: 3. Escalation > 3.2 Noise complaints after 22:00
---
<chunk content>
```

**Generate 2–4 hypothetical questions per chunk at ingest time** and embed them alongside. Users ask "can I cancel free?"; the document says "cancellation without penalty". This closes that gap cheaply. Handbook §43.2.

**Hybrid retrieval, always.** Vector search plus Postgres full-text plus the question index, fused with Reciprocal Rank Fusion (k=60). Vector-only fails on contract numbers, vendor names and rate codes — which is half of what hotel users search for. Handbook §45.1.

**Pre-filter, never post-filter.** `tenant_id`, property scope and validity window are applied before the vector search, not after.

**Rerank with a cross-encoder**, 30 candidates in, 8 out, with a score threshold below which chunks are dropped even if they are in the top 8. **The system must be allowed to return zero results** and say "I don't have anything on that" rather than answering from a weak chunk. Handbook §45.3.

**Expired documents are excluded by default.** A superseded 2023 policy is worse than no policy.

## 9. The answer pipeline

Keep it linear. No LangGraph in Phase 0 — there is no branching worth a graph runtime yet.

```
guard → understand → retrieve → synthesise → validate → persist → stream
```

- **guard** — deterministic input checks, rate limit, budget check.
- **understand** — one small structured-output call resolving the question and its scope. Cheap model.
- **retrieve** — the pipeline in §8. If nothing clears the threshold, skip to a "no evidence" envelope. Do not proceed to synthesis with weak context.
- **synthesise** — one structured-output call producing the envelope, constrained to the four block types, with `provenance_refs` on every block.
- **validate** — deterministic. Schema valid. Every cited chunk ID was actually retrieved. Every factual claim maps to a chunk. Strip what fails and log it.
- **persist** — envelope, turn, usage, retrieval log.
- **stream** — SSE per handbook §10.3 and §24.2. Emit `turn.started`, `trace`, `layout`, `block.*`, `envelope.complete`.

**Untrusted content is fenced.** Retrieved chunks go into the prompt inside labelled tags with an explicit instruction that content within them is data, not instructions. Handbook §38.2.

**Refusal is a valid, well-designed outcome.** "I don't have a document covering that — here's what I do have on this topic" is a good answer and should look deliberate, not like an error.

## 10. Marketing site and SEO

Not a redesign for its own sake. One job: a hotel owner arrives, understands the promise, and signs up.

**Content structure**

- `/` — the promise, one clear demo (a real screenshot or short loop of a cited answer), proof, signup.
- `/product` — what it does, in the owner's language, not ours.
- `/pricing` — even if it says "early access, free during pilot".
- `/resources/*` — the SEO engine. Genuinely useful articles on hotel operations, revenue management basics, SOP templates. This is a 3–6 month investment; start publishing in week one.
- `/legal/privacy`, `/legal/terms`, `/legal/dpa` — required before any customer uploads a document. Not optional.

**Technical SEO — all of this, no exceptions**

- Server-rendered. Marketing routes are RSC with no client-side data fetching for primary content.
- Unique `<title>` and meta description per page, driven by Next.js Metadata API.
- Canonical URLs. One hostname, `https`, no `www`/non-`www` split.
- `sitemap.xml` and `robots.txt` generated, not hand-maintained.
- JSON-LD: `Organization`, `SoftwareApplication` on product pages, `Article` + `BreadcrumbList` on resources, `FAQPage` where genuinely applicable.
- OpenGraph and Twitter cards, with generated OG images per page.
- Semantic heading hierarchy, one `h1` per page.
- Core Web Vitals: LCP ≤ 2.0s, INP ≤ 200ms, CLS ≤ 0.05, verified in Lighthouse CI on every PR.
- All images through `next/image`, correct dimensions, meaningful `alt`.
- `hreflang` only if we actually ship a second language — do not add it speculatively.
- Internal linking from resources to product pages with descriptive anchors.

**Do not do:** keyword stuffing, AI-generated bulk content, doorway pages, or anything you would be embarrassed to explain. It does not work and it damages a young domain.

**Analytics on the marketing site** — a privacy-respecting analytics tool plus our own `analytics.event` capture on signup funnel steps. No third-party trackers before the privacy policy is live.

## 11. Admin panel

Internal only, behind a `soyl_staff` role, every access written to `audit.log`. Ugly is fine. Useful is mandatory.

- **Tenants** — list, detail, document count, question count, last active, impersonate (audited, time-boxed, banner shown).
- **Questions** — every question ever asked, filterable by tenant and date, full-text searchable, exportable to CSV. This is the screen you will use most.
- **Answer inspector** — for any turn: the question, the resolved scope, the retrieved chunks with scores, the raw model output, what validation stripped, and the final envelope. This is your debugger for a probabilistic system and it is worth building well. Handbook §27.3.
- **Documents** — ingestion status, failures with the actual error, reprocess button.
- **Funnel** — signups, verified, created a property, uploaded a document, asked a question, returned in week 2. Cohorted by week.
- **Cost** — spend per tenant per day from the usage ledger.

## 12. Milestones

Work these in order. Do not start the next until the acceptance criteria pass.

### M1 — Foundation (target: 1 week)

Monorepo, CI (lint, typecheck, test, build), Docker Compose for local Postgres + Redis + object storage, `make setup` and `make dev`, Railway environments for staging and production, migration 001 with core tables and RLS enabled.

**Accepted when:** a new machine goes from `git clone` to a running local stack in under 30 minutes, and the tenant isolation test suite passes with at least one real table.

### M2 — Auth and tenancy (target: 1 week)

Signup, email verification, login, logout, password reset, Google OAuth, session handling, the Next.js → API JWT exchange, `Principal` and `TenantContext` resolution, tenant and property creation, the RLS session variable set per request.

**Accepted when:** two tenants exist, each with a property, and an automated test proves neither can read the other's rows through any API route. Audit log records every auth event.

### M3 — Ingestion (target: 1.5 weeks)

Upload via short-lived signed URL directly to storage, ingestion job queue, extraction, structure-aware chunking, context headers, hypothetical questions, embedding, indexing, status surfaced in the UI, failures visible and retryable.

**Accepted when:** a 40-page PDF SOP uploads and is queryable within two minutes, chunks carry correct heading paths, and a deliberately corrupt file fails gracefully with a readable error rather than a stack trace.

### M4 — Retrieval and answers (target: 2 weeks)

Hybrid retrieval, RRF, reranking, threshold, context assembly, the answer pipeline, the envelope, validation, SSE streaming, the ask UI with citations and the source drawer.

**Accepted when:** on a hand-labelled set of 40 question/chunk pairs built from real pilot documents, recall@10 ≥ 0.85 and precision@5 ≥ 0.70; every answer carries working citations; and asking something genuinely not covered by the corpus produces an honest "I don't have that" rather than a confident invention. **Test the last one deliberately and often.**

### M5 — Marketing site and SEO (target: 1 week)

All pages, all technical SEO, legal pages, signup funnel instrumented, first three resource articles published.

**Accepted when:** Lighthouse ≥ 95 on SEO and ≥ 90 on performance for every marketing route in CI, structured data validates, and the sitemap is submitted.

### M6 — Admin panel (target: 1 week)

All six screens from §11.

**Accepted when:** you can take any answer the system gave, open it in the inspector, and explain in under a minute why it said what it said.

**Total: roughly 7–8 weeks for two engineers.** If it is running materially over, cut M6 down to the questions list and the answer inspector — those two are the ones that matter.

## 13. Engineering standards

- `ruff`, `mypy --strict`, `import-linter`, `eslint`, `tsc --noEmit`, `gitleaks` — all in CI, all blocking.
- Every input is a Pydantic model with `extra="forbid"`. No raw dict access from a request body.
- All SQL parameterised. **No model-generated SQL executed against the database, ever.**
- Settings validated at startup with a `Settings` class; production invariants enforced in a validator. Handbook §62.1.
- Structured logging with `trace_id` on every line and in every error response.
- Every migration reversible and backward compatible with the previous release.
- Tests: unit for logic, integration against real Postgres via testcontainers, and the tenant isolation suite. Do not use SQLite — we depend on RLS, JSONB and vector types.
- Conventional Commits, trunk-based development, short-lived branches.

## 14. How to work with me

- **Ask before assuming** on anything product-shaped. Technical calls are yours; product calls are mine.
- **Flag scope creep explicitly.** If a task is turning into two, say so before writing the code.
- **Push back on this brief where it is wrong.** It was written before you saw the codebase.
- Work in small, reviewable increments. A 3,000-line PR is not reviewable and will not be reviewed properly.
- When a milestone's acceptance criteria pass, stop and say so. Do not roll straight into the next one.

## 15. The one thing to hold onto

The product is not the chat box. It is the fact that every answer can be traced to a document the hotel gave us, and that the system says "I don't know" when it doesn't. That is what makes it an advisor rather than a random-answer generator, and it is the only durable advantage in this build.

Everything in §6 exists to protect that. If something has to be cut, cut features — not provenance, not the isolation tests, and not the question log.