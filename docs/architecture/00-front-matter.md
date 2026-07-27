# SOYL AI — Hotel Operating System

## Internal Engineering Architecture Handbook

**Classification:** Internal — Confidential. Do not distribute outside SOYL AI Pvt. Ltd.

**Document owner:** Office of the CTO

**Audience:** Software engineers, AI engineers, cloud/platform engineers, product managers, UI/UX designers

**Status:** Living document. This is the single source of truth for the architecture of the SOYL Hotel Operating System. Where this document and the codebase disagree, the codebase is the bug until this document is amended through the ADR process described in Appendix A.

**Version:** 1.0 — Initial architecture baseline

---

### Revision history

| Version | Date | Author | Summary |
|---|---|---|---|
| 0.1 | — | Office of the CTO | Skeleton, principles, target state |
| 0.9 | — | Office of the CTO | Full technical review draft |
| 1.0 | Current | Office of the CTO | Architecture baseline approved for Phase 1 execution |

---

### How to read this document

This handbook is long by design. It is not meant to be read front to back in one sitting. It is meant to be the thing you open when you are about to write code and you need to know what the rest of the system expects from you.

Read it in these slices:

| If you are | Read closely | Skim | Skip initially |
|---|---|---|---|
| A frontend engineer | Parts II, III | Parts I, IV | Parts VIII, IX |
| An AI engineer | Parts I, V, VI, VII | Part III | Parts II, IX |
| A backend engineer | Parts I, IV, VIII | Parts V, VII | Part II |
| A platform/cloud engineer | Parts IX, XII | Parts IV, VIII | Parts II, III |
| A product manager | Parts I, III, XIV | Parts V, X | Parts IV, VIII, IX |
| A designer | Parts I, II, III | Part XIV | Parts IV–IX |

**Conventions used throughout.**

- Every significant technology choice is written as **Decision → Rationale → Alternatives considered → Trade-off accepted → Reversal cost**. If a decision does not carry a reversal cost, it was not a real decision.
- `MUST`, `SHOULD`, `MAY` are used in the RFC 2119 sense. `MUST` items are enforced in CI wherever mechanically possible.
- Diagrams are Mermaid. The source is embedded so any engineer can edit them in place rather than hunting for a `.drawio` file that has drifted from reality.
- Code samples are illustrative and abbreviated. They show shape and intent, not production completeness. Production code lives in the monorepo.
- **Reversal cost** is rated **Low** (a sprint), **Medium** (a quarter), or **High** (a rewrite). We deliberately accept High-reversal-cost decisions only where the alternative is paralysis.

---

### The one-paragraph version

SOYL is building an intelligence layer that sits on top of hotel operational data and renders its conclusions as software, not as prose. A hotel owner asks a question in natural language; the platform plans a response, calls tools against the hotel's own data and against external market signals, reasons over the result, and returns a **structured response envelope** that the frontend renders as live dashboards, KPI cards, charts, supplier comparisons, action plans and interactive workflows. The conversation is the input surface. The generated interface is the product. Everything in this document exists to make that loop fast, correct, cheap, secure, multi-tenant, and extensible for a decade.

### Standing constraints

These constraints shaped every decision in this document. If any of them changes, large parts of this architecture should be re-litigated.

1. **Team size is 2–5 engineers through Phase 3.** Operational complexity is a first-class cost. Every service we run is a service someone must be paged for at 3am, and there are not enough of us to have a rotation. This is the single largest force behind the modular-monolith decision (Part IV) and the managed-everything infrastructure decision (Part IX).
2. **The existing SOYL Cloud platform is Next.js + Python/FastAPI.** The AI layer is a module inside the existing monorepo and shares its authentication, its tenancy model and its application shell. It is not a second product with a second login.
3. **Microsoft Azure is the target cloud. AWS is excluded.** This is a strategic constraint, not a technical preference, and it is treated as fixed.
4. **We are not model-locked.** OpenAI and Azure AI Foundry are the initial providers. SOYL proprietary models are a stated destination. No business logic may import a provider SDK.
5. **Multi-tenancy is not a Phase 5 problem.** Hotel financial data is commercially sensitive. Tenant isolation is designed in from the first migration, not retrofitted.
