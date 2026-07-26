# Part XI — Security

## 56. Threat model

Before controls, the threats — otherwise we build security theatre.

| # | Threat | Likelihood | Impact | Primary controls |
|---|---|---|---|---|
| T1 | **Cross-tenant data exposure** | Medium | Existential | RLS, tenant-keyed caches, isolation test suite, cache clear on tenant switch |
| T2 | **Credential compromise (customer)** | High | High | MFA, session management, anomaly detection, short-lived tokens |
| T3 | **Credential compromise (staff)** | Medium | Existential | Entra + Conditional Access, PIM, no standing production access |
| T4 | **Indirect prompt injection via ingested content** | High | Medium | Capability limitation, structural separation, output validation (§38.2) |
| T5 | **Connector credential theft** | Low | High | Envelope encryption, Key Vault, least privilege |
| T6 | **Supply chain (dependency compromise)** | Medium | High | Pinned deps, SBOM, Dependabot, CodeQL, signed images |
| T7 | **Data exfiltration by an authorised insider** | Low | High | Audit logging, export limits, anomaly detection |
| T8 | **Model provider data leakage** | Low | High | Zero-retention agreements, no training on our data, PII minimisation before send |
| T9 | **DoS / cost exhaustion** | Medium | Medium | WAF, rate limits, budgets, circuit breakers |
| T10 | **Guest PII exposure in AI output** | Medium | High | Scope gating, output policy validation, PII minimisation at ingest |
| T11 | **Competitor data misuse** | Low | Medium | Licensed sources only, connector-layer enforcement |
| T12 | **Backup/restore path compromise** | Low | Existential | Immutable backups, separate credentials, restricted restore permissions |

**T1 and T4 are the two that are specific to this product.** Everything else is standard SaaS security done properly.

## 57. Identity and access

### 57.1 Customer identity

- Email + password with **Argon2id** hashing, or SSO.
- **MFA mandatory for `owner` and `tenant:admin` roles**, optional but strongly encouraged for others. TOTP, with WebAuthn/passkeys in Phase 4.
- Session: httpOnly, Secure, SameSite=Lax cookie; 12-hour idle timeout, 30-day absolute; bound to a device fingerprint with re-authentication on significant change.
- Password reset via a single-use, 15-minute, non-enumerating token.
- Progressive account lockout with a notification to the account owner.
- Enterprise SSO via Entra External ID / SAML from Phase 5, with SCIM provisioning in Phase 6.

### 57.2 Staff identity

- Entra ID with **Conditional Access**: compliant device, MFA, and — for production access — a named location.
- **Privileged Identity Management** for all production roles. There is **no standing production access.** Elevation is time-boxed (maximum 8 hours), justified in writing, approved, and logged.
- Break-glass accounts: two, with credentials in a sealed physical envelope, excluded from Conditional Access, alerting loudly on any use, and tested quarterly.
- Production database access is via Bastion + PIM only, and every session is logged.

### 57.3 RBAC

Detailed in §23.2. The additional principles:

- **Roles are assigned per tenant**, never globally. A user can be an owner of one tenant and a viewer of another.
- **Property scoping is separate from role.** A revenue manager with access to two of five properties holds `revenue:*` on those two only.
- **Scope checks are explicit.** No implicit "admin can do anything" path in code. `owner` holds `*:write` as an explicit scope, checked identically to any other.
- **Every permission change writes an audit record** with actor, subject, before, after and reason.

## 58. Data protection

### 58.1 Encryption

| State | Mechanism |
|---|---|
| In transit (external) | TLS 1.3, HSTS with preload, TLS 1.2 minimum |
| In transit (internal) | TLS via private endpoints; mTLS within the Container Apps environment |
| At rest (database) | Azure Storage Service Encryption, AES-256; customer-managed keys available for enterprise tenants in Phase 5 |
| At rest (blob) | SSE with infrastructure double-encryption on sensitive containers |
| At rest (backups) | Encrypted, geo-redundant, immutability policy |
| Application-level | Connector credentials via envelope encryption (per-tenant data key wrapped by a Key Vault key) |
| Secrets | Key Vault, HSM-backed for signing keys |

### 58.2 Data classification

| Class | Examples | Controls |
|---|---|---|
| **Public** | Marketing content | None |
| **Internal** | Aggregate benchmarks, anonymised stats | Auth required |
| **Confidential** | Hotel financials, rates, occupancy, contracts | Tenant isolation, RBAC, audit, encryption |
| **Restricted** | Guest PII, staff PII, payment data | All of the above + explicit scope + minimisation + retention limits + access alerting |

**Payment card data is never stored.** Gateway tokenisation only. We are not in PCI scope and we intend to stay out of it.

### 58.3 GDPR / DPDP readiness

India's DPDP Act 2023 and GDPR overlap enough that satisfying the stricter of the two is the practical approach. Note that hotel guest data means **our customers are data controllers and we are a processor** — which shapes every obligation below.

| Requirement | Implementation |
|---|---|
| Lawful basis | Contract (customer users); the tenant's own basis for guest data, documented in the DPA |
| Data minimisation | Guest PII minimised at connector ingestion (§55.2); we ingest analytical attributes, not identities, by default |
| Purpose limitation | Documented per data category; no secondary use without consent |
| **Right of access** | Self-service export of all data for a user or tenant, machine-readable |
| **Right to erasure** | Documented cascade across Postgres, Redis (the cache registry, §49.3, exists partly for this), Blob, ClickHouse and backups. Backups are handled by documented retention expiry rather than surgical deletion — a stated, defensible position. |
| **Right to rectification** | Editable via the product; AI semantic facts are user-visible and deletable (§32.5) |
| Portability | JSON/CSV export |
| Retention | Per-category schedule (§58.4), automatically enforced |
| **Breach notification** | 72-hour process, documented, with a named owner and a rehearsed runbook |
| Records of processing | Maintained in `docs/compliance/ropa.md` |
| DPIA | Completed for AI processing of business and guest data |
| Sub-processors | Published list; customers notified of changes with an objection window |
| International transfers | SCCs where applicable; India-region inference for tenants requiring residency |
| **Automated decision-making** | Our AI *recommends*; humans *decide* (§18.2). This keeps us outside the Article 22 restrictions on solely-automated decisions with legal or significant effect — and it is another reason the human-confirmation rule is architectural, not cosmetic. |

### 58.4 Retention

| Data | Retention | Rationale |
|---|---|---|
| Conversations and envelopes | 24 months, then delete (tenant-configurable down to 3 months) | Utility vs exposure |
| Orchestration checkpoints | 7 days | Operational only |
| Traces | 30 days hot, 90 days archived | Debugging |
| Analytics events | 24 months | Trend analysis |
| Audit logs | 7 years | Legal |
| Usage ledger | 7 years | Financial records |
| Guest-linked records | Per tenant instruction, default 24 months | Tenant is the controller |
| Documents | Until deleted by the tenant | Customer-owned |
| Backups | 35 days | DR |
| Deleted tenant data | 30-day soft delete, then hard delete | Accident recovery |

### 58.5 AI-specific data handling

- **Zero data retention agreements with every model provider.** Non-negotiable, verified contractually before any provider is used with customer data.
- **No training on customer data**, by any provider, ever, without a separately-negotiated, explicit, revocable consent.
- **PII minimisation before inference:** guest names, emails, phone numbers and card fragments are stripped or pseudonymised before content reaches a model. Where a feature legitimately needs a name (drafting a review response), it is substituted with a placeholder and re-inserted after generation, client-side of the model boundary.
- **Prompt and completion logging is on** for debugging and evaluation, with PII redaction applied, 30-day retention, and access restricted and audited.
- **Tenant opt-out** from prompt logging is available and honoured, at the cost of reduced supportability, which is explained.
- **Cross-tenant benchmarking** uses k-anonymised aggregates only: a minimum cohort of 5 properties, no single property contributing more than 30% of a cohort, differential-privacy noise on small cohorts, and opt-in participation. A benchmark that lets a user infer a specific competitor's ADR is a product we will not ship.

## 59. Application security

### 59.1 Input validation

- **Every input is a Pydantic model.** No raw dict access from a request body anywhere.
- Strict types, explicit bounds, explicit enums. `extra="forbid"` on request models — an unexpected field is an error, not silently ignored.
- File uploads: type validated by content sniffing, not extension; size limited; virus scanned; **rendered from a separate storage domain** so a malicious SVG or HTML cannot execute in our origin.
- All SQL parameterised. No string interpolation. **No LLM-generated SQL executed against the database, ever** — this is worth stating explicitly because "text-to-SQL" is a tempting shortcut that would undermine both the metric-definition discipline (§4.2) and tenant isolation.

### 59.2 Output security

- Content Security Policy with nonces, no `unsafe-inline`, no `unsafe-eval`.
- Markdown rendered through a strict allowlist sanitiser. **No raw HTML from AI output** — enforced by the envelope schema, since `text.markdown` is a restricted subset.
- Envelope block payloads are typed and validated; there is no free-form HTML path from model to DOM.
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` minimising defaults.
- Downloads served with `Content-Disposition: attachment` from a separate domain.

### 59.3 API security

- Authentication on every endpoint; the default is deny, and unauthenticated routes are an explicit, reviewed allowlist.
- Rate limiting (§26.4).
- CORS: same-origin by design (§2.4), which removes an entire configuration risk.
- CSRF: SameSite cookies plus a double-submit token for state-changing requests from the BFF.
- No sensitive data in URLs or query strings — they land in logs and referrers.
- Request size limits, request timeouts, connection limits.
- **API responses never include internal identifiers, stack traces, or SQL.** Errors carry a code and a trace ID (§22.2).

### 59.4 Audit logging

```sql
CREATE TABLE audit.log (
    id              BIGSERIAL,
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    tenant_id       UUID,
    actor_kind      TEXT NOT NULL,          -- user | system | ai | support
    actor_id        UUID,
    action          TEXT NOT NULL,          -- 'property.update', 'export.generate'
    resource_kind   TEXT NOT NULL,
    resource_id     TEXT,
    outcome         TEXT NOT NULL,          -- success | denied | error
    ip              INET,
    user_agent      TEXT,
    trace_id        TEXT,
    before          JSONB,
    after           JSONB,
    reason          TEXT,
    PRIMARY KEY (id, occurred_at)
) PARTITION BY RANGE (occurred_at);
```

Audited events: authentication (success and failure), permission changes, all data exports, connector configuration changes, document deletion, tenant settings changes, all AI write actions, all support access to customer data, all break-glass elevation.

The log is **append-only** (no UPDATE or DELETE grants to the application role) and mirrored to an immutable Blob container. Customers on enterprise plans can export their own audit log — which converts a compliance obligation into a feature.

### 59.5 Supply chain

- Dependencies pinned with lockfiles; Dependabot with grouped weekly PRs.
- `pip-audit` and `npm audit` in CI; high-severity findings block merge.
- CodeQL on every PR.
- Container base images: distroless or slim, rebuilt weekly, scanned with Trivy in the registry.
- **SBOM generated and stored per build**; images signed with Cosign and verified at deploy.
- No `curl | bash` in any Dockerfile or CI step.
- A quarterly review of all third-party services with data access.

## 60. AI-specific security

Consolidating the AI-specific controls scattered through this document, because they are the ones a standard security review will not ask about:

| Risk | Control | Reference |
|---|---|---|
| Prompt injection (direct) | Low incentive; capability limitation bounds impact | §38.2 |
| Prompt injection (indirect, via documents/reviews) | Structural separation, sanitisation, injection scoring, quarantine, capability limitation | §38.2, §42 |
| Privilege escalation via tool calls | `tenant_id` not model-controllable; per-tool authorisation; entitlement-filtered tool visibility | §23.3 |
| Unauthorised side effects | Human confirmation with preview and single-use token | §18.2 |
| Data exfiltration via AI output | Output policy validation; scope-gated PII; export rate limits | §33.4 |
| Cost exhaustion attack | Per-turn and per-tenant budgets, rate limits | §29.6 |
| Model provider data leakage | Zero-retention contracts, PII minimisation, residency routing | §58.5 |
| Hallucinated actions | No autonomous execution; all actions confirmed | §18.2, §34.5 |
| Cross-tenant leakage via cache | `tenant_id` in every cache key, asserted by test | §31.5 |
| Cross-tenant leakage via memory | No cross-tenant memory; benchmarks k-anonymised | §32.6, §58.5 |
| Model supply chain | Provider allowlist; model version pinning; capability verification | §35 |
| Jailbreak to out-of-scope use | Scope classifier; refusal policy; monitoring of refusal rate | §38.4 |

---

# Part XII — DevOps and Engineering Practice

## 61. Repository and branching

**Monorepo**, pnpm + Turborepo for JS, uv for Python. One repository, one version of the truth, atomic cross-cutting changes.

**Trunk-based development.** Short-lived branches, merged to `main` within two days. `main` is always deployable. Feature flags, not long-lived branches — with a 3-person team, a week-old branch is a merge conflict waiting to become a wasted day.

**Conventional Commits** for automated changelog and semantic versioning.

**Required checks before merge:** lint, typecheck, unit, integration, contract, security scan, and — when AI paths are touched — evals. One approving review; two for changes to auth, tenancy, migrations or the envelope schema.

## 62. Code quality

| Concern | Tool | Enforcement |
|---|---|---|
| Python format + lint | `ruff` | CI, pre-commit |
| Python types | `mypy --strict` | CI |
| Python imports/architecture | `import-linter` | CI (§20.3) |
| Python async correctness | `flake8-async` | CI |
| TS lint | `eslint` (incl. `jsx-a11y`, `import/no-restricted-paths`) | CI, pre-commit |
| TS types | `tsc --noEmit`, strict | CI |
| Formatting | `prettier`, `ruff format` | pre-commit |
| Secrets | `gitleaks` | pre-commit, CI, push protection |
| SQL | `sqlfluff` | CI |
| Bicep | `bicep lint` | CI |
| Bundle size | `size-limit` | CI (§14.1) |
| Test coverage | `pytest-cov`, `vitest --coverage` | ≥ 80% on domain and application layers; no target on adapters |

Coverage is a floor, not a goal. A PR raising coverage by testing getters is not a good PR. Reviewers should ask whether the *risky* code is tested, not whether the number went up.

## 62.1 Configuration and environment variables

Configuration bugs are a top-three cause of production incidents in small teams, and they are almost entirely preventable with two rules: **validate at startup, and have exactly one precedence order.**

**Precedence, highest wins:**

```
1. Process environment              (container runtime, CI)
2. Key Vault secret reference       (injected by Container Apps as env)
3. App Configuration                (hot-reloadable, non-secret)
4. .env file                        (local development only — never in an image)
5. Declared default in Settings     (must be safe for production)
```

**Everything is typed and validated at startup.** A missing or malformed value fails the process before it accepts traffic, rather than at 3am when the code path is first hit:

```python
# soyl/settings.py
class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="SOYL_", env_file=".env", extra="forbid", frozen=True,
    )

    environment: Literal["local", "preview", "dev", "staging", "prod"]
    database_url: PostgresDsn
    redis_url: RedisDsn
    blob_account_url: HttpUrl
    key_vault_url: HttpUrl | None = None

    max_turn_seconds: float = 120.0
    default_turn_budget_inr: Decimal = Decimal("15.00")

    @model_validator(mode="after")
    def production_invariants(self) -> "Settings":
        if self.environment == "prod":
            if self.key_vault_url is None:
                raise ValueError("prod requires SOYL_KEY_VAULT_URL")
            if "localhost" in str(self.database_url):
                raise ValueError("prod database_url points at localhost")
        return self
```

The `production_invariants` validator is the load-bearing part. It encodes the mistakes we know we would otherwise make.

**Rules:**

1. **`extra="forbid"`.** An unrecognised `SOYL_*` variable is a startup error, not a silently-ignored typo. `SOYL_DATABSE_URL` should crash, not fall back to a default.
2. **`.env.example` is exhaustive and is checked in CI** — a new setting without a corresponding example entry fails the build.
3. **No secret has a default.** A default-valued secret is a secret that will ship.
4. **Config is read once, at startup, into a frozen object.** No `os.environ` reads scattered through the codebase; a grep for `os.environ` outside `settings.py` is a lint failure. This makes the entire configuration surface enumerable.
5. **Hot-reloadable config is a separate, explicit mechanism** (App Configuration + a 60s-TTL cache, §49.1) and is limited to things that genuinely must change without a deploy: model routes, feature flags, rate-limit multipliers, kill switches. Everything else requires a deploy, which is a feature — it makes the change reviewable.
6. **Frontend environment variables are split explicitly.** Anything prefixed `NEXT_PUBLIC_` is compiled into the client bundle and is therefore public by definition. A CI check greps the built bundle for known secret patterns.

## 63. Documentation

Documentation lives in the repository and is reviewed with the code that it describes.

```
docs/
├── architecture/
│   ├── HANDBOOK.md              # this document
│   ├── adr/                     # one file per decision
│   └── diagrams/
├── runbooks/                    # one per alert — mandatory
├── guides/
│   ├── onboarding.md            # day-1 to productive
│   ├── local-development.md
│   ├── adding-a-block-type.md
│   ├── adding-a-tool.md
│   ├── adding-an-agent.md
│   ├── adding-a-connector.md
│   ├── writing-prompts.md
│   └── writing-evals.md
├── compliance/
│   ├── ropa.md
│   ├── dpia.md
│   ├── subprocessors.md
│   └── retention-schedule.md
├── api/                         # generated from OpenAPI
└── postmortems/
```

The four `adding-a-*.md` guides are the highest-leverage documentation in the repository. They encode the extension seams from §5.1 as step-by-step recipes. When adding a block type is a documented 20-minute recipe, the catalog grows; when it requires archaeology, it does not.

**ADRs are mandatory** for anything with a Medium or High reversal cost. Format: Context, Decision, Alternatives considered, Consequences, Reversal cost, Status. An ADR that does not list rejected alternatives is not an ADR.

## 64. Local development

```bash
git clone && cd soyl
make setup      # uv sync, pnpm install, pre-commit install, .env from template
make up         # docker compose: postgres+pgvector, redis, azurite, mailpit
make seed       # FixtureHotel: 2 years of synthetic data, documents, users
make dev        # web + api + worker with hot reload
make test       # full local suite
make eval       # AI evals against fixtures
```

**Target: a new engineer is running the full stack with realistic data within 30 minutes of cloning.** This is measured on every new hire, and when it slips, fixing it takes priority over feature work. A slow local setup taxes every single day of every engineer's tenure.

Local development uses real Postgres and Redis via Docker — never SQLite or fakes. The differences between SQLite and Postgres (RLS, JSONB, vector types, partitioning) are precisely the features we depend on.

Model calls in local development default to a **recorded-cassette mode**: real responses captured once and replayed, so development is fast, free and deterministic. A flag switches to live calls when needed.
