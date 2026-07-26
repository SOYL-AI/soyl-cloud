# SOYL Architecture Handbook

The long-term engineering architecture for the SOYL Hotel Operating System.

## Read this first

**This handbook describes the destination, not the current build.** `Update.md` at the repo root defines what we are building now (Phase 0). Where the two disagree, **`Update.md` wins** — it was written with the current reality in mind and this handbook was not.

The handbook was also written on a false premise: it assumes soyl.cloud is an existing authenticated Next.js + FastAPI product to integrate into. It isn't — it's a marketing site. Treat §2.4 ("Integration with the existing SOYL Cloud platform") and the Phase 1 plan in §68 as void. Everything else stands.

Do not build anything from this handbook that `Update.md` places out of scope. It describes six phases of work; you are executing Phase 0.

## Contents

| File | Covers | Key sections for Phase 0 |
|---|---|---|
| [00-front-matter.md](00-front-matter.md) | How to read, conventions, standing constraints | — |
| [01-foundations.md](01-foundations.md) | Product thesis, system context, domain model, architectural principles | **§4.2** metric definitions · **§5** principles P1–P10 |
| [02-frontend.md](02-frontend.md) | Frontend stack, folder structure, components, state, streaming, design system, a11y | **§10** API + SSE · **§11** design tokens · **§12** accessibility |
| [03-generative-ui.md](03-generative-ui.md) | The Response Envelope, block catalog, renderer, actions, failure modes | **§16** envelope schema · **§17** blocks · **§19** degradation |
| [04-backend.md](04-backend.md) | Modular monolith, folder structure, API design, auth, streaming, jobs, observability, testing | **§21** structure · **§22.4** gateway · **§23** authn/authz · **§24** SSE |
| [05-ai-orchestration.md](05-ai-orchestration.md) | LangGraph, agents, tools, memory, synthesis, budgets | **§33** synthesis + validation |
| [06-models-prompts-eval.md](06-models-prompts-eval.md) | Model abstraction, routing, prompt architecture, guardrails, evaluation | **§35** provider protocol · **§37** prompts · **§38** guardrails |
| [07-retrieval.md](07-retrieval.md) | The full RAG pipeline: ingest, chunk, embed, retrieve, rerank, assemble | **All of it** — this is the Phase 0 core |
| [08-data.md](08-data.md) | PostgreSQL schemas, pgvector, RLS, indexing, partitioning, migrations, Redis, ClickHouse | **§48.7** RLS · **§48.11** migrations · **§49** Redis |
| [09-infrastructure-integrations.md](09-infrastructure-integrations.md) | Azure, Railway, CI/CD, DR, connectors, messaging, payments | **§52** Railway · **§55.6** email |
| [10-security-devops.md](10-security-devops.md) | Threat model, identity, data protection, GDPR/DPDP, app security, DevOps, config | **§58.3** privacy · **§59** app security · **§62.1** config |
| [11-folders-roadmap.md](11-folders-roadmap.md) | Full folder trees and the six-phase roadmap | **§21, §66** trees |
| [12-appendices.md](12-appendices.md) | ADR index, API examples, a complete worked envelope, glossary, checklists, open questions | **Appendix C** — read this to understand the envelope |

## The five things that carry into Phase 0

Everything else in here is future work. These are load-bearing now:

1. **The Response Envelope** (§16, Appendix C) — structured output is the contract. Never a markdown string.
2. **Provenance on every claim** (§5 P3, §33.4) — validated deterministically, stripped when unsupported.
3. **Row-level security** (§48.7) — from migration 001, enforced in Postgres, not in application code.
4. **The RAG pipeline** (Part VII) — contextual chunk headers, hypothetical questions, hybrid retrieval, RRF, reranking with a threshold, and the ability to return nothing.
5. **The provider abstraction** (§35) — no provider SDK imported outside the adapter layer.

## Conventions

- Section references appear as `§n.n` throughout, and resolve to the numbered headings in these files.
- The 32 diagrams are **Mermaid source in fenced blocks**, not images. GitHub renders them natively, and you can read and edit them in place rather than hunting for a source file that has drifted from reality.
- `MUST` / `SHOULD` / `MAY` are RFC 2119.
- Every significant decision is written as Decision → Rationale → Alternatives → Trade-off → Reversal cost. The ADR index is Appendix A.

## Amending this

Changes go through an ADR in `docs/architecture/adr/`. If you find something in here that is wrong given what the codebase actually is, say so rather than working around it — several assumptions in this document have already turned out to be false.

**Classification:** Internal — Confidential. SOYL AI Pvt. Ltd.
