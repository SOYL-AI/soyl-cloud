# Appendices

## Appendix A — Architecture Decision Record index

Every decision below has a full ADR in `docs/architecture/adr/`. This index is the summary; the ADR carries the full context and the rejected alternatives.

| ADR | Decision | Reversal cost | Section |
|---|---|---|---|
| 001 | Next.js App Router as the frontend framework | High | §6.1 |
| 002 | Apache ECharts for visualisation, spec-driven | Medium | §6.1 |
| 003 | TanStack Query + Zustand + URL for state; no Redux | Low | §9.1 |
| 004 | Zod runtime validation at every AI-output boundary | Low | §6.2 |
| 005 | Closed block vocabulary; the model never emits markup | **High** | §17.1 |
| 006 | Response Envelope as the sole AI output contract | **High** | §16 |
| 007 | `refresh_spec` — reasoning and data binding are separable | Medium | §16.4 |
| 008 | SSE over WebSockets for AI streaming | Medium | §10.1 |
| 009 | Capability-negotiated synthesis | Low | §19.2 |
| 010 | Modular monolith, pre-cut extraction seams | Medium | §20.1 |
| 011 | Four-layer architecture with import linting | Low | §20.3 |
| 012 | ARQ for jobs; Service Bus for durable messaging | Low | §25.1 |
| 013 | Hand-rolled DI container; no DI framework | Low | §28.1 |
| 014 | LangGraph as the orchestration runtime; not LangChain abstractions | Medium | §29.1 |
| 015 | Agents are invisible to users | Low | §30.1 |
| 016 | Agents never converse; they contribute to shared evidence | Low | §30.5 |
| 017 | `tenant_id` is never a model-visible tool parameter | Low | §23.3 |
| 018 | Two-stage synthesis with deterministic block materialisation | Medium | §33.2 |
| 019 | Deterministic validation gate; unprovenanced claims are stripped | Low | §33.4 |
| 020 | Metrics computed only by `soyl.metrics`, never by the model | Low | §4.2 |
| 021 | Model abstraction layer; no provider SDK outside adapters | Low | §35 |
| 022 | Logical model routes, hot-reloadable config | Low | §35.3 |
| 023 | Prompts are versioned files in the repository | Low | §37.1 |
| 024 | Evaluation gates merges on AI paths | Low | §39.5 |
| 025 | RAG for unstructured knowledge only; never for numbers | Medium | §40 (Part VII opening) |
| 026 | Structure-aware chunking + contextual headers | Low | §43 |
| 027 | Hybrid retrieval with RRF + cross-encoder reranking | Low | §45.1 |
| 028 | PostgreSQL + pgvector as the single primary store | High | §48.1 |
| 029 | Shared schema multi-tenancy with RLS | **High** | §48.7 |
| 030 | Daily OTB snapshots from day one | **Irreversible if missed** | §48.4 |
| 031 | Monthly range partitioning on time-series tables | Medium | §48.9 |
| 032 | Expand/contract migrations; backward compatible for one release | Low | §48.11 |
| 033 | Redis: cache and queue must not share eviction policy | Low | §49.2 |
| 034 | ClickHouse for events and analytics, introduced at a defined trigger | Medium | §50.1 |
| 035 | Azure Container Apps; not App Service, not AKS | Medium | §51.2 |
| 036 | No public network access on data services | Low | §51.5 |
| 037 | Railway for Phase 1–2, Azure from Phase 3, on defined triggers | Low | §52.2 |
| 038 | Bicep for Azure IaC; Terraform for third parties | Low | §53.4 |
| 039 | Single-region DR with 8-hour RTO accepted through Phase 4 | Medium | §54.3 |
| 040 | Connector protocol with declared capability manifests | Low | §55.1 |
| 041 | Human confirmation required for every side-effecting AI action | Low | §18.2 |
| 042 | Cross-tenant benchmarking is k-anonymised and opt-in | Low | §58.5 |
| 043 | No LLM-generated SQL executed against the database | Low | §59.1 |
| 044 | Contracts package as the single cross-language schema source | Low | §65.1 |
| 045 | BFF-first API surface; API Management deferred until the partner API | Medium | §22.4 |
| 046 | Notification delivery through a single channel-agnostic dispatcher | Low | §55.6 |

---

## Appendix B — API reference (selected)

### B.1 Create a turn (streaming)

```http
POST /api/v1/os/conversations/01JB8Q0000000000000000/turns HTTP/1.1
Host: soyl.cloud
Authorization: Bearer <jwt>
Content-Type: application/json
Accept: text/event-stream
Idempotency-Key: 01JB8Q2H4K5M6N7P8R9S0T1U2V

{
  "input": {
    "type": "text",
    "content": "Why was last weekend soft compared to last year?"
  },
  "context": {
    "property_ids": ["01JAAAAAAAAAAAAAAAAAAAAAA1"],
    "date_range": { "from": "2026-07-17", "to": "2026-07-20" },
    "seed": { "source": "ambient", "route": "property.revenue" }
  },
  "envelope_version": "2",
  "client_capabilities": {
    "block_types": [
      "text.markdown", "metric.kpi", "metric.group", "chart.timeseries",
      "chart.bar", "chart.heatmap", "table.generic", "table.comparison",
      "plan.actions", "alert.callout", "doc.citation", "compare.periods"
    ],
    "max_cols": 4,
    "supports_maps": false,
    "density": "comfortable"
  }
}
```

**Response:** `200 OK`, `Content-Type: text/event-stream` — see §10.3 for the event sequence.

### B.2 Refresh a block (no model call)

```http
POST /api/v1/os/blocks/b5/refresh HTTP/1.1
Content-Type: application/json

{ "envelope_id": "01JB8Q2H4K5M6N7P8R9S0T1U2V" }
```

```json
{
  "block_id": "b5",
  "payload": { "...": "refreshed data" },
  "provenance_refs": ["tc_1", "revpar@v2"],
  "refreshed_at": "2026-07-25T11:02:14Z",
  "as_of": "2026-07-25T10:00:00Z",
  "cost_inr": 0.0
}
```

`"cost_inr": 0.0` is not a placeholder. Refreshing a block costs one indexed query.

### B.3 Preview and execute an action

```http
POST /api/v1/os/blocks/b8/actions/create_rate_plan_review HTTP/1.1

{ "mode": "preview", "payload": { "target_dates": ["2026-08-01", "2026-08-02"] } }
```

```json
{
  "preview": {
    "summary": "Create a rate review task for 1–2 August across 1 property.",
    "effects": [
      { "kind": "record", "description": "Creates 1 task assigned to Revenue Manager" },
      { "kind": "notification", "count": 1 }
    ],
    "reversible": true,
    "reversal": "The task can be deleted at any time.",
    "requires_scope": "revenue:write"
  },
  "confirmation_token": "cft_01JB8Q9999999999999999"
}
```

```http
POST /api/v1/os/blocks/b8/actions/create_rate_plan_review HTTP/1.1

{
  "mode": "execute",
  "confirmation_token": "cft_01JB8Q9999999999999999",
  "payload": { "target_dates": ["2026-08-01", "2026-08-02"] }
}
```

### B.4 Pin a block to a Space

```http
POST /api/v1/os/spaces/01JBSPACE0000000000000/pins HTTP/1.1

{
  "envelope_id": "01JB8Q2H4K5M6N7P8R9S0T1U2V",
  "block_id": "b1",
  "title": "RevPAR — rolling 30 days",
  "position": 0
}
```

### B.5 Upload a document

```http
POST /api/v1/os/knowledge/documents HTTP/1.1

{
  "filename": "Guest-Complaint-SOP-v4.pdf",
  "content_type": "application/pdf",
  "size_bytes": 482913,
  "property_ids": [],
  "doc_type": "sop",
  "effective_from": "2026-01-15"
}
```

```json
{
  "document_id": "01JBDOC00000000000000",
  "upload": {
    "url": "https://soylstore.blob.core.windows.net/docs/...?sv=...&sig=...",
    "method": "PUT",
    "headers": { "x-ms-blob-type": "BlockBlob" },
    "expires_at": "2026-07-25T11:30:00Z"
  },
  "status": "awaiting_upload"
}
```

The client uploads directly to Blob with a scoped, short-lived SAS. The document bytes never pass through our API — which removes a bandwidth cost, a timeout risk and a memory pressure source in one decision.

### B.6 Error responses

```json
{
  "type": "https://docs.soyl.cloud/errors/forbidden",
  "title": "Insufficient permissions",
  "status": 403,
  "detail": "This action requires the revenue:write scope.",
  "instance": "/api/v1/os/blocks/b8/actions/create_rate_plan_review",
  "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
  "code": "FORBIDDEN",
  "retryable": false,
  "context": { "required_scope": "revenue:write", "held_scopes": ["revenue:read"] }
}
```

---

## Appendix C — Complete envelope example

A full, realistic envelope for the question *"Why was last weekend soft in Goa compared to last year?"* Abbreviated only where repetition adds nothing.

```jsonc
{
  "envelope_id": "01JB8Q2H4K5M6N7P8R9S0T1U2V",
  "version": "2",
  "turn_id": "01JB8Q2H4K5M6N7P8R9S0T1U2W",
  "conversation_id": "01JB8Q0000000000000000",
  "tenant_id": "01JAA00000000000000000",
  "created_at": "2026-07-25T09:14:02.441Z",
  "locale": "en-IN",

  "intent": {
    "primary": "revenue.diagnose_variance",
    "confidence": 0.91,
    "entities": {
      "properties": [{ "id": "01JAAAAAAAAAAAAAAAAAAAAAA1", "name": "Beach House Goa" }],
      "period": { "from": "2026-07-17", "to": "2026-07-20", "grain": "day", "label": "last weekend" },
      "comparison": { "kind": "prior_year_same_dow", "from": "2025-07-18", "to": "2025-07-21" },
      "metrics": ["revpar", "adr", "occupancy"]
    },
    "unresolved": []
  },

  "summary": {
    "headline": "RevPAR fell 18.3% versus the same weekend last year. The entire gap is rate — occupancy was actually 2 points higher.",
    "tone": "negative",
    "confidence": "high"
  },

  "layout": {
    "kind": "grid",
    "cols": 4,
    "slots": [
      { "block_id": "b1", "span": 1 }, { "block_id": "b2", "span": 1 },
      { "block_id": "b3", "span": 1 }, { "block_id": "b4", "span": 1 },
      { "block_id": "b5", "span": 4 }, { "block_id": "b6", "span": 4 },
      { "block_id": "b7", "span": 2 }, { "block_id": "b8", "span": 2 }
    ]
  },

  "blocks": [
    {
      "id": "b1",
      "type": "metric.kpi",
      "title": "RevPAR",
      "payload": {
        "label": "RevPAR",
        "value": 4187.32,
        "unit": "INR",
        "precision": 0,
        "metric_id": "revpar@v2",
        "period": { "from": "2026-07-17", "to": "2026-07-20", "grain": "day" },
        "comparison": {
          "kind": "prior_year",
          "value": 5124.88,
          "delta_abs": -937.56,
          "delta_pct": -18.29,
          "direction": "unfavourable"
        },
        "sparkline": { "points": [4402, 4310, 4051, 3986], "labels": ["17 Jul","18 Jul","19 Jul","20 Jul"] },
        "annotation": "Excludes 2 out-of-order rooms"
      },
      "provenance_refs": ["tc_1", "revpar@v2"],
      "refresh_spec": {
        "tool": "metrics.aggregate",
        "args": {
          "property_ids": ["01JAAAAAAAAAAAAAAAAAAAAAA1"],
          "metrics": ["revpar"], "frm": "2026-07-17", "to": "2026-07-20",
          "compare": "prior_year"
        },
        "ttl_seconds": 900,
        "refreshable": true
      },
      "actions": [{ "key": "drill", "label": "Break down by day", "kind": "query" }],
      "state": "complete", "confidence": "high", "pinnable": true, "exportable": true
    },

    { "id": "b2", "type": "metric.kpi", "title": "ADR",
      "payload": { "label": "ADR", "value": 5498.10, "unit": "INR", "metric_id": "adr@v2",
        "period": { "from": "2026-07-17", "to": "2026-07-20" },
        "comparison": { "kind": "prior_year", "value": 6890.40, "delta_abs": -1392.30,
                        "delta_pct": -20.21, "direction": "unfavourable" } },
      "provenance_refs": ["tc_1", "adr@v2"], "state": "complete" },

    { "id": "b3", "type": "metric.kpi", "title": "Occupancy",
      "payload": { "label": "Occupancy", "value": 0.7616, "unit": "percent", "metric_id": "occupancy@v3",
        "period": { "from": "2026-07-17", "to": "2026-07-20" },
        "comparison": { "kind": "prior_year", "value": 0.7437, "delta_abs": 0.0179,
                        "delta_pct": 2.41, "direction": "favourable" } },
      "provenance_refs": ["tc_1", "occupancy@v3"], "state": "complete" },

    { "id": "b4", "type": "metric.kpi", "title": "Room nights sold",
      "payload": { "label": "Room nights", "value": 128, "unit": "nights",
        "metric_id": "rooms_sold@v1",
        "period": { "from": "2026-07-17", "to": "2026-07-20" },
        "comparison": { "kind": "prior_year", "value": 125, "delta_abs": 3,
                        "delta_pct": 2.40, "direction": "favourable" } },
      "provenance_refs": ["tc_1"], "state": "complete" },

    {
      "id": "b5",
      "type": "chart.timeseries",
      "title": "ADR and Occupancy, 17–20 July vs same weekend 2025",
      "subtitle": "Rate is the entire story",
      "payload": {
        "x": { "kind": "time", "grain": "day",
               "values": ["2026-07-17","2026-07-18","2026-07-19","2026-07-20"] },
        "series": [
          { "id": "adr_2026", "label": "ADR 2026", "unit": "INR", "axis": "left",
            "values": [5710.00, 5602.00, 5390.00, 5290.40], "emphasis": true,
            "metric_id": "adr@v2" },
          { "id": "adr_2025", "label": "ADR 2025", "unit": "INR", "axis": "left",
            "style": "dashed", "values": [7010.00, 6980.00, 6820.00, 6751.60] },
          { "id": "occ_2026", "label": "Occupancy 2026", "unit": "percent", "axis": "right",
            "values": [0.771, 0.762, 0.757, 0.756] },
          { "id": "occ_2025", "label": "Occupancy 2025", "unit": "percent", "axis": "right",
            "style": "dashed", "values": [0.748, 0.744, 0.742, 0.741] }
        ],
        "y_axes": [
          { "id": "left",  "label": "ADR", "unit": "INR", "zero_based": false },
          { "id": "right", "label": "Occupancy", "unit": "percent", "min": 0, "max": 1 }
        ],
        "annotations": [
          { "kind": "band", "at": ["2026-07-18","2026-07-19"], "label": "Comp set dropped rates 12%",
            "severity": "warning" }
        ],
        "description": "Line chart comparing ADR and occupancy for 17 to 20 July 2026 against the same weekend in 2025. ADR in 2026 ranges from ₹5,290 to ₹5,710, consistently about ₹1,300 to ₹1,460 below 2025. Occupancy in 2026 ranges from 75.6% to 77.1%, slightly above 2025 throughout."
      },
      "provenance_refs": ["tc_1", "tc_3", "adr@v2", "occupancy@v3"],
      "refresh_spec": {
        "tool": "metrics.timeseries",
        "args": { "property_ids": ["01JAAAAAAAAAAAAAAAAAAAAAA1"],
                  "metrics": ["adr","occupancy"], "frm": "2026-07-17", "to": "2026-07-20",
                  "grain": "day", "compare": "prior_year" },
        "ttl_seconds": 900, "refreshable": true
      },
      "actions": [
        { "key": "change_grain", "label": "Weekly", "kind": "param", "patch": { "grain": "week" } },
        { "key": "extend", "label": "Show full month", "kind": "param",
          "patch": { "frm": "2026-07-01", "to": "2026-07-31" } }
      ],
      "state": "complete", "confidence": "high", "pinnable": true, "exportable": true
    },

    {
      "id": "b6",
      "type": "table.comparison",
      "title": "ADR by booking channel",
      "payload": {
        "entities": [
          { "id": "direct",  "label": "Direct" },
          { "id": "bcom",    "label": "Booking.com" },
          { "id": "mmt",     "label": "MakeMyTrip" },
          { "id": "agoda",   "label": "Agoda" }
        ],
        "rows": [
          { "key": "adr_2026",  "label": "ADR 2026",  "unit": "INR",
            "values": { "direct": 6420, "bcom": 5210, "mmt": 4980, "agoda": 5110 } },
          { "key": "adr_2025",  "label": "ADR 2025",  "unit": "INR",
            "values": { "direct": 7180, "bcom": 6940, "mmt": 6810, "agoda": 6720 } },
          { "key": "delta_pct", "label": "Change",    "unit": "percent",
            "values": { "direct": -10.6, "bcom": -24.9, "mmt": -26.9, "agoda": -23.9 },
            "highlight": "min" },
          { "key": "mix_2026",  "label": "Share of room nights", "unit": "percent",
            "values": { "direct": 0.22, "bcom": 0.31, "mmt": 0.28, "agoda": 0.19 } }
        ],
        "note": "OTA channels account for the overwhelming majority of the rate decline."
      },
      "provenance_refs": ["tc_2"],
      "state": "complete", "confidence": "high", "pinnable": true, "exportable": true
    },

    {
      "id": "b7",
      "type": "text.markdown",
      "title": "What happened",
      "payload": {
        "content": "The weekend was not a demand problem. You sold **three more room nights** than the equivalent weekend last year, and occupancy was 1.8 points higher.\n\nThe entire RevPAR gap is rate. ADR fell 20.2%, and the decline is concentrated in OTA channels — Booking.com, MakeMyTrip and Agoda all dropped roughly 24–27%, while direct bookings held far better at −10.6%.\n\nThree properties in your comp set reduced published rates by an average of 12% on 16 July, two days before the weekend. Your channel-managed rates appear to have followed them down."
      },
      "provenance_refs": ["tc_1", "tc_2", "tc_3"],
      "state": "complete", "confidence": "high", "exportable": true
    },

    {
      "id": "b8",
      "type": "plan.actions",
      "title": "What to do",
      "payload": {
        "horizon": "this_week",
        "items": [
          {
            "id": "a1",
            "title": "Review the OTA rate parity rules that tracked the comp set down",
            "rationale": "OTA ADR fell 25% while direct fell 11%. Occupancy did not require the discount — you were already ahead of last year on volume.",
            "expected_impact": { "metric_id": "revpar@v2", "value": 640, "unit": "INR", "confidence": "medium" },
            "effort": "low",
            "priority": 1,
            "owner_role": "revenue_manager",
            "due": "2026-07-28",
            "evidence_refs": ["tc_1", "tc_2", "tc_3"],
            "action": { "key": "create_rate_plan_review", "label": "Create review task",
                        "scope": "revenue:write", "payload": { "target": "ota_parity" } }
          },
          {
            "id": "a2",
            "title": "Hold rate for 24–27 July rather than matching the comp set again",
            "rationale": "On-the-books for next weekend is 8% ahead of the same point last year. Demand does not currently justify a rate reduction.",
            "expected_impact": { "metric_id": "revpar@v2", "value": 410, "unit": "INR", "confidence": "low" },
            "effort": "low",
            "priority": 2,
            "owner_role": "revenue_manager",
            "evidence_refs": ["tc_4"]
          },
          {
            "id": "a3",
            "title": "Push direct booking share — it held rate 14 points better",
            "rationale": "Direct ADR declined 10.6% against 25% on OTAs. Every point of mix shift toward direct is worth roughly ₹12 of RevPAR at current rates.",
            "expected_impact": { "metric_id": "revpar@v2", "value": 180, "unit": "INR", "confidence": "low" },
            "effort": "medium",
            "priority": 3,
            "owner_role": "general_manager",
            "evidence_refs": ["tc_2"]
          }
        ]
      },
      "provenance_refs": ["tc_1", "tc_2", "tc_3", "tc_4"],
      "state": "complete", "confidence": "medium", "exportable": true
    }
  ],

  "provenance": {
    "tool_calls": [
      { "id": "tc_1", "tool": "metrics.timeseries", "row_count": 8, "latency_ms": 143,
        "source": "postgres.fact.daily_metric", "as_of": "2026-07-25T06:00:00Z", "is_final": true },
      { "id": "tc_2", "tool": "metrics.channel_mix", "row_count": 32, "latency_ms": 186,
        "source": "postgres.fact.daily_metric_segment", "as_of": "2026-07-25T06:00:00Z" },
      { "id": "tc_3", "tool": "market.compset_rates", "row_count": 24, "latency_ms": 1811,
        "source": "external.rateshop", "as_of": "2026-07-25T04:30:00Z",
        "freshness_warning": "Comp-set rates are up to 29 hours old." },
      { "id": "tc_4", "tool": "pace.pickup", "row_count": 14, "latency_ms": 97,
        "source": "postgres.fact.otb_snapshot", "as_of": "2026-07-25T06:00:00Z" }
    ],
    "documents": [],
    "metric_definitions": ["revpar@v2", "adr@v2", "occupancy@v3", "rooms_sold@v1"]
  },

  "actions": [
    { "key": "export", "label": "Export to PDF", "kind": "export", "requires_confirmation": false },
    { "key": "pin_all", "label": "Pin to a Space", "kind": "pin", "requires_confirmation": false }
  ],

  "followups": [
    { "label": "What are comp set rates for next weekend?",
      "prompt": "Show comp set published rates for 24–27 July against ours." },
    { "label": "Is this happening on weekdays too?",
      "prompt": "Compare weekday and weekend ADR for July against last year." },
    { "label": "How much did the OTA discount cost in total?",
      "prompt": "Quantify the total revenue impact of the OTA rate decline for 17–20 July." }
  ],

  "diagnostics": {
    "degraded": false,
    "warnings": [
      { "code": "DATA_FRESHNESS",
        "message": "Competitor rate data is up to 29 hours old.",
        "affected_blocks": ["b5"], "severity": "low" }
    ],
    "usage": {
      "input_tokens": 8214, "output_tokens": 1902, "reasoning_tokens": 640,
      "cached_tokens": 5100, "tool_calls": 4, "wall_ms": 6120,
      "cost_inr": 3.71, "model_route": "reasoning.default", "prompt_versions": {
        "system": "core@v3", "agent": "agents/revenue@v5", "synthesis": "synthesis/compose@v7"
      }
    }
  }
}
```

**Read that envelope as a specification.** Every field is doing work: the KPI `direction` fields prevent colour errors; the chart `description` is the accessible representation; every `plan.actions` item carries non-empty `evidence_refs`; the `freshness_warning` propagates from the tool call to a user-visible warning; `refresh_spec` makes b1 and b5 pinnable at zero marginal cost; and `usage` makes the turn's economics auditable. That is the whole architecture, compressed into one JSON document.

---

## Appendix D — Glossary

| Term | Meaning |
|---|---|
| **ADR** | Average Daily Rate — room revenue ÷ occupied room nights |
| **Agent** | Internal, user-invisible specialisation of reasoning for one domain |
| **ALOS** | Average Length of Stay |
| **ARN** | Available Room Nights |
| **Assertion log** | Record of numeric claims made in a conversation, used for consistency checking |
| **Block** | A single typed UI component specification within an envelope |
| **Budget** | Per-turn ceiling on tokens, tool calls, wall clock and cost |
| **Capability pack** | A bundled, entitlement-gated set of tools, agents, prompts and blocks |
| **Comp set** | The competitor property set a hotel benchmarks against |
| **Connector** | An adapter to an external system implementing the `Connector` protocol |
| **CPOR** | Cost Per Occupied Room |
| **Envelope** | The complete structured AI response — see §16 |
| **Evidence store** | Keyed collection of typed tool results within a turn |
| **GOP / GOPPAR** | Gross Operating Profit / per Available Room |
| **MPI / ARI / RGI** | Market Penetration, Average Rate, Revenue Generation Index |
| **OTB** | On The Books — confirmed future reservations |
| **Pace** | Cumulative on-the-books for a future date, by days-out |
| **Pickup** | Change in on-the-books between two snapshot dates |
| **Principal** | The authenticated actor with resolved tenant, roles, scopes and properties |
| **Provenance** | The traceable source of a claim: tool call, metric definition or document chunk |
| **`refresh_spec`** | The stored specification allowing a block's data to be re-fetched without a model call |
| **RevPAR / TRevPAR** | Revenue per Available Room / Total Revenue per Available Room |
| **RLS** | PostgreSQL Row-Level Security |
| **RRF** | Reciprocal Rank Fusion |
| **Space** | A persisted, named collection of pinned blocks that refresh on open |
| **Tool** | A typed, permissioned, auditable function callable by the AI |
| **Turn** | One user input and its resulting envelope |
| **USALI** | Uniform System of Accounts for the Lodging Industry |
| **Working set** | The explicit, user-visible current scope: properties, period, comparison |

---

## Appendix E — Engineering checklists

### E.1 Adding a block type

1. Define the payload model in `soyl/domain/ai/envelope/blocks/`.
2. Register it in `BLOCK_REGISTRY`.
3. If data-bound, write the deterministic materialiser in `envelope/materialise/` **plus its unit test**.
4. Run `make contracts` to regenerate JSON Schema, TypeScript and Zod.
5. `pnpm gen:block <type>` to scaffold the frontend directory.
6. Implement the component, skeleton, empty state and error state.
7. Write the Storybook story for every state.
8. Write the test, **including the `axe` assertion** (§12.1).
9. Declare `minCols`, `pinnable`, `exportable`, `streamable`.
10. Add it to the registry array.
11. Add a golden envelope fixture using it.
12. Update the synthesis prompt's block catalog description.
13. Add an eval case that should produce it.
14. Verify the print/export rendering.

### E.2 Adding a tool

1. Write the function with `@tool`, full Pydantic types, and a model-facing description that says when **not** to use it.
2. Declare `scope`, `pack`, `cache` policy, `deadline_seconds`, `cost_class`.
3. Re-authorise inside the function; never trust visibility filtering.
4. Return typed results with `row_count`, `as_of` and any warnings.
5. Handle the empty case as a result, not an error.
6. Unit test against a real database with `FixtureHotel`.
7. Add it to the relevant agents' tool lists — check the ~40-tool ceiling.
8. Add an eval case that requires it and one where it must **not** be selected.
9. Verify the cache key includes `tenant_id`.

### E.3 Pre-deployment

- [ ] Migrations are backward compatible with the previous release.
- [ ] Migrations tested against a production-sized dataset.
- [ ] No `ACCESS EXCLUSIVE` locks on large tables.
- [ ] Feature flags default to off for new capability.
- [ ] Evals pass; cost regression is under 15% or explicitly approved.
- [ ] New alerts have runbooks.
- [ ] Rollback path verified.
- [ ] Secrets rotated if any were exposed in the change.
- [ ] SBOM generated; images signed.

### E.4 Incident response

1. Declare severity and open a channel.
2. Assign an incident lead — one person, explicitly named.
3. Mitigate before diagnosing. Roll back, flag off, or shed load.
4. Communicate: status page within 15 minutes for P1/P2.
5. Preserve evidence — traces, logs, the envelope, the trace ID.
6. Resolve.
7. Blameless postmortem within 48 hours.
8. Produce at least one of: an eval case, a test, an alert, or a runbook.

---

## Appendix F — Open questions

Recorded honestly, because an architecture document that pretends to have resolved everything is not credible. Each has a decision owner and a decision-by phase.

| # | Question | Owner | Decide by |
|---|---|---|---|
| 1 | Do we expose a "show me the SQL" affordance to power users? It would strengthen trust considerably but creates a support surface and an implicit API. | Product + CTO | Phase 3 |
| 2 | Should Spaces be collaborative (real-time multi-user) or single-user with sharing? Collaboration implies WebSockets and CRDTs. | Product | Phase 5 |
| 3 | Is cross-tenant benchmarking a product we are willing to ship at all, given that k-anonymity in a small local market may still be identifying? | CTO + Legal | Phase 5 |
| 4 | At what point do we fine-tune our own synthesis model? Requires stable evals and roughly 10k high-quality traces. | AI lead | Phase 5–6 |
| 5 | Do we support tenant-authored block types or tenant-authored tools? Enormous extensibility value; significant security and support cost. | CTO | Phase 6 |
| 6 | Voice: input only, or full conversational voice? The latter changes the interaction model substantially and may conflict with a visual-first product. | Product | Phase 5 |
| 7 | Do we become a PMS, or stay a layer above one? The data ownership argument is strong; the effort is enormous. | Founders | Phase 6 |
| 8 | Should the metric definition set be tenant-configurable beyond the current flags? Chains have genuine, defensible differences. | Product + Data | Phase 4 |

---

*End of document.*

*This handbook is maintained in `docs/architecture/HANDBOOK.md`. Amendments require an ADR. Questions to the Office of the CTO.*
