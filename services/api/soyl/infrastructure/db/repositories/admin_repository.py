"""Queries behind the six admin screens (`UPDATE.md` §11).

Every method here runs on a `staff_session` and reads across tenants. Two
things follow, and both are the opposite of the rule everywhere else in this
package:

1. **`tenant_id` appears in WHERE clauses**, because filtering to one tenant is
   now a *feature* rather than a security boundary. It is worth being blunt
   about which: if a filter here were dropped, the screen would show too much,
   not leak — a staff session is entitled to read every row by policy. The
   boundary is that `staff_read` is `FOR SELECT`, so nothing in this file can
   write.
2. **Aggregates are computed in SQL, not Python.** The funnel and cost screens
   would otherwise pull every ledger row across every tenant into the API to
   sum it, which stops working at exactly the scale that makes the screen worth
   looking at.

Read-only by construction: there is no INSERT or UPDATE in this module. The one
admin action that writes — reprocessing a document — is deliberately not here,
because it has to run as the tenant to satisfy `tenant_isolation`.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text

# A questions page. Big enough to scan, small enough that the CSV export is the
# obvious tool for anything larger.
PAGE_SIZE = 50
# The CSV is the "take it away and pivot it" path. Capped anyway: an unbounded
# export is a way to make one admin request hold a database connection for a
# very long time.
EXPORT_LIMIT = 20_000


@dataclass(frozen=True, slots=True)
class TenantSummary:
    tenant_id: uuid.UUID
    name: str
    slug: str
    status: str
    created_at: datetime
    member_count: int
    property_count: int
    document_count: int
    question_count: int
    # The most recent of: a question asked, a document uploaded, a session seen.
    # Any one alone reads as "inactive" for a tenant that is simply using a
    # different part of the product.
    last_active_at: datetime | None


@dataclass(frozen=True, slots=True)
class QuestionRow:
    turn_id: uuid.UUID
    conversation_id: uuid.UUID
    tenant_id: uuid.UUID
    tenant_name: str
    user_email: str | None
    question: str
    status: str
    asked_at: datetime
    latency_ms: int | None
    cost_inr: Decimal


@dataclass(frozen=True, slots=True)
class InspectorChunk:
    chunk_id: uuid.UUID
    document_id: uuid.UUID | None
    document_title: str | None
    heading_path: list[str]
    ordinal: int | None
    token_count: int | None
    content: str
    score: float
    # False for the ones the threshold rejected. The distinction M4 needed
    # within an hour: "we found it and scored it 0.20" is a different bug from
    # "we never found it", and from outside both are an empty answer.
    kept: bool


@dataclass(frozen=True, slots=True)
class InspectorUsage:
    kind: str
    provider: str | None
    model: str | None
    input_tokens: int
    output_tokens: int
    cost_inr: Decimal


@dataclass
class Inspection:
    """Everything needed to explain one answer, in one round of queries."""

    turn_id: uuid.UUID
    conversation_id: uuid.UUID
    tenant_id: uuid.UUID
    tenant_name: str
    user_email: str | None
    question: str
    status: str
    asked_at: datetime
    completed_at: datetime | None
    latency_ms: int | None
    input_tokens: int
    output_tokens: int
    cost_inr: Decimal
    trace_id: str | None
    # Null when the turn failed before synthesis.
    envelope: dict[str, Any] | None = None
    draft: dict[str, Any] | None = None
    strips: list[dict[str, Any]] = field(default_factory=list)
    retrieval_query: str | None = None
    retrieval_filters: dict[str, Any] = field(default_factory=dict)
    reranked: bool = False
    retrieval_ms: int | None = None
    chunks: list[InspectorChunk] = field(default_factory=list)
    usage: list[InspectorUsage] = field(default_factory=list)
    feedback: list[dict[str, Any]] = field(default_factory=list)


@dataclass(frozen=True, slots=True)
class DocumentRow:
    document_id: uuid.UUID
    tenant_id: uuid.UUID
    tenant_name: str
    title: str
    doc_type: str
    status: str
    page_count: int | None
    chunk_count: int
    created_at: datetime
    job_status: str | None
    job_stage: str | None
    job_error: str | None
    attempts: int


@dataclass(frozen=True, slots=True)
class FunnelWeek:
    """One signup cohort. Every count is *of that cohort*, not of that week.

    That distinction is the whole point of cohorting: "40 people verified this
    week" mixes signups from six different weeks and cannot tell you whether
    verification is getting better or worse.
    """

    week: date
    signed_up: int
    verified: int
    created_property: int
    uploaded_document: int
    asked_question: int
    returned_week_two: int


@dataclass(frozen=True, slots=True)
class CostRow:
    day: date
    tenant_id: uuid.UUID
    tenant_name: str
    cost_inr: Decimal
    input_tokens: int
    output_tokens: int
    calls: int


class AdminRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    # ── Tenants ─────────────────────────────────────────────────────────────

    async def tenants(self) -> list[TenantSummary]:
        """Every tenant, with the counts that say whether it is alive.

        Correlated subqueries rather than four LEFT JOINs with GROUP BY: joining
        properties, documents and turns in one query multiplies the rows before
        it counts them, and the count of documents comes back multiplied by the
        number of turns. That bug is silent — the numbers look plausible.
        """
        rows = (
            await self._session.execute(
                text(
                    """
                    SELECT
                        t.id, t.name, t.slug, t.status, t.created_at,
                        (SELECT count(*) FROM core.membership m
                          WHERE m.tenant_id = t.id) AS member_count,
                        (SELECT count(*) FROM core.property p
                          WHERE p.tenant_id = t.id AND p.deleted_at IS NULL) AS property_count,
                        (SELECT count(*) FROM rag.document d
                          WHERE d.tenant_id = t.id AND d.deleted_at IS NULL) AS document_count,
                        (SELECT count(*) FROM ai.turn tu
                          WHERE tu.tenant_id = t.id) AS question_count,
                        GREATEST(
                            (SELECT max(tu.started_at) FROM ai.turn tu WHERE tu.tenant_id = t.id),
                            (SELECT max(d.created_at) FROM rag.document d WHERE d.tenant_id = t.id),
                            (SELECT max(s.last_seen_at) FROM core.session s
                              WHERE s.active_tenant_id = t.id)
                        ) AS last_active_at
                    FROM core.tenant t
                    WHERE t.deleted_at IS NULL
                    ORDER BY last_active_at DESC NULLS LAST, t.created_at DESC
                    """
                )
            )
        ).all()

        return [
            TenantSummary(
                tenant_id=row.id,
                name=row.name,
                slug=row.slug,
                status=row.status,
                created_at=row.created_at,
                member_count=row.member_count,
                property_count=row.property_count,
                document_count=row.document_count,
                question_count=row.question_count,
                last_active_at=row.last_active_at,
            )
            for row in rows
        ]

    async def tenant(self, tenant_id: uuid.UUID) -> TenantSummary | None:
        found = [t for t in await self.tenants() if t.tenant_id == tenant_id]
        return found[0] if found else None

    async def tenant_members(self, tenant_id: uuid.UUID) -> list[dict[str, Any]]:
        rows = (
            await self._session.execute(
                text(
                    """
                    SELECT u.id, u.email, u.display_name, m.role, m.property_scope,
                           u.email_verified_at, m.created_at
                      FROM core.membership m
                      JOIN core.user_account u ON u.id = m.user_id
                     WHERE m.tenant_id = CAST(:tenant_id AS uuid)
                     ORDER BY m.created_at
                    """
                ),
                {"tenant_id": str(tenant_id)},
            )
        ).all()
        return [
            {
                "user_id": str(row.id),
                "email": row.email,
                "display_name": row.display_name,
                "role": row.role,
                "property_scope": row.property_scope,
                "email_verified": row.email_verified_at is not None,
                "joined_at": row.created_at,
            }
            for row in rows
        ]

    async def tenant_properties(self, tenant_id: uuid.UUID) -> list[dict[str, Any]]:
        rows = (
            await self._session.execute(
                text(
                    """
                    SELECT id, name, address, timezone, rooms_total, segment,
                           status, created_at
                      FROM core.property
                     WHERE tenant_id = CAST(:tenant_id AS uuid) AND deleted_at IS NULL
                     ORDER BY created_at
                    """
                ),
                {"tenant_id": str(tenant_id)},
            )
        ).all()
        return [
            {
                "property_id": str(row.id),
                "name": row.name,
                "address": row.address,
                "timezone": row.timezone,
                "rooms_total": row.rooms_total,
                "segment": row.segment,
                "status": row.status,
                "created_at": row.created_at,
            }
            for row in rows
        ]

    # ── Questions ───────────────────────────────────────────────────────────

    async def questions(
        self,
        *,
        tenant_id: uuid.UUID | None = None,
        since: datetime | None = None,
        until: datetime | None = None,
        status: str | None = None,
        search: str | None = None,
        limit: int = PAGE_SIZE,
        offset: int = 0,
    ) -> list[QuestionRow]:
        """The screen you will use most (§11).

        Search is stemmed full-text rather than `ILIKE '%…%'`. Searching
        `cancel` therefore finds "cancelled" and "cancellation", which is what
        someone hunting a theme means; `websearch_to_tsquery` also gives them
        quoted phrases and `-exclusions` without a parser here. The cost is that
        it will not find a substring inside a word, which is a fair trade for a
        list of questions and is indexed (migration 007) rather than a scan.

        Every parameter is cast explicitly. asyncpg infers a parameter's type
        from its use, and `:x IS NULL` gives it nothing to infer from — the
        query then fails at execution rather than at review, which cost an
        afternoon in M4.
        """
        rows = (
            await self._session.execute(
                text(
                    f"""
                    SELECT t.id, t.conversation_id, t.tenant_id, ten.name AS tenant_name,
                           u.email AS user_email, t.input, t.status, t.started_at,
                           t.latency_ms, t.cost_inr
                      FROM ai.turn t
                      JOIN core.tenant ten ON ten.id = t.tenant_id
                      LEFT JOIN core.user_account u ON u.id = t.user_id
                     WHERE {_QUESTION_FILTERS}
                     ORDER BY t.started_at DESC
                     LIMIT :limit OFFSET :offset
                    """  # noqa: S608 - _QUESTION_FILTERS is a constant in this
                    # module and every value it references is a bound parameter.
                ),
                _question_params(tenant_id, since, until, status, search)
                | {"limit": limit, "offset": offset},
            )
        ).all()

        return [_question_row(row) for row in rows]

    async def question_count(
        self,
        *,
        tenant_id: uuid.UUID | None = None,
        since: datetime | None = None,
        until: datetime | None = None,
        status: str | None = None,
        search: str | None = None,
    ) -> int:
        """The total behind the current filter, for the pager.

        A separate count query rather than a window function on the page: the
        window would compute the total for every row of every page, and the
        pager needs it once.
        """
        result = await self._session.execute(
            # S608 as above: a module constant, and every value is bound.
            text(f"SELECT count(*) FROM ai.turn t WHERE {_QUESTION_FILTERS}"),  # noqa: S608
            _question_params(tenant_id, since, until, status, search),
        )
        return int(result.scalar_one())

    async def questions_for_export(
        self,
        *,
        tenant_id: uuid.UUID | None = None,
        since: datetime | None = None,
        until: datetime | None = None,
        status: str | None = None,
        search: str | None = None,
    ) -> list[QuestionRow]:
        return await self.questions(
            tenant_id=tenant_id,
            since=since,
            until=until,
            status=status,
            search=search,
            limit=EXPORT_LIMIT,
            offset=0,
        )

    # ── Answer inspector ────────────────────────────────────────────────────

    async def inspect(self, turn_id: uuid.UUID) -> Inspection | None:
        """One turn, fully explained (§11, handbook §27.3).

        Six queries rather than one join. The shapes genuinely differ — a turn
        is one row, chunks are many, usage is many, feedback is many — and
        joining them produces a cross product that has to be un-multiplied in
        Python, which is where the counts silently go wrong.
        """
        turn = (
            await self._session.execute(
                text(
                    """
                    SELECT t.id, t.conversation_id, t.tenant_id, ten.name AS tenant_name,
                           u.email AS user_email, t.input, t.status, t.started_at,
                           t.completed_at, t.latency_ms, t.input_tokens, t.output_tokens,
                           t.cost_inr, t.trace_id
                      FROM ai.turn t
                      JOIN core.tenant ten ON ten.id = t.tenant_id
                      LEFT JOIN core.user_account u ON u.id = t.user_id
                     WHERE t.id = CAST(:turn_id AS uuid)
                    """
                ),
                {"turn_id": str(turn_id)},
            )
        ).first()

        if turn is None:
            return None

        inspection = Inspection(
            turn_id=turn.id,
            conversation_id=turn.conversation_id,
            tenant_id=turn.tenant_id,
            tenant_name=turn.tenant_name,
            user_email=turn.user_email,
            question=turn.input,
            status=turn.status,
            asked_at=turn.started_at,
            completed_at=turn.completed_at,
            latency_ms=turn.latency_ms,
            input_tokens=turn.input_tokens,
            output_tokens=turn.output_tokens,
            cost_inr=turn.cost_inr,
            trace_id=turn.trace_id,
        )

        envelope = (
            await self._session.execute(
                text(
                    "SELECT body, draft, strips FROM ai.envelope "
                    "WHERE turn_id = CAST(:turn_id AS uuid)"
                ),
                {"turn_id": str(turn_id)},
            )
        ).first()
        if envelope is not None:
            inspection.envelope = envelope.body
            inspection.draft = envelope.draft
            inspection.strips = list(envelope.strips or [])

        retrieval = (
            await self._session.execute(
                text(
                    """
                    SELECT query, filters, chunk_ids, scores, rejected_ids,
                           rejected_scores, reranked, latency_ms
                      FROM ai.retrieval_log
                     WHERE turn_id = CAST(:turn_id AS uuid)
                     ORDER BY created_at
                     LIMIT 1
                    """
                ),
                {"turn_id": str(turn_id)},
            )
        ).first()

        if retrieval is not None:
            inspection.retrieval_query = retrieval.query
            inspection.retrieval_filters = retrieval.filters or {}
            inspection.reranked = retrieval.reranked
            inspection.retrieval_ms = retrieval.latency_ms
            inspection.chunks = await self._chunks(
                kept=list(zip(retrieval.chunk_ids, retrieval.scores, strict=False)),
                rejected=list(
                    zip(retrieval.rejected_ids, retrieval.rejected_scores, strict=False)
                ),
            )

        usage = (
            await self._session.execute(
                text(
                    """
                    SELECT kind, provider, model, input_tokens, output_tokens, cost_inr
                      FROM billing.usage_ledger
                     WHERE turn_id = CAST(:turn_id AS uuid)
                     ORDER BY occurred_at
                    """
                ),
                {"turn_id": str(turn_id)},
            )
        ).all()
        inspection.usage = [
            InspectorUsage(
                kind=row.kind,
                provider=row.provider,
                model=row.model,
                input_tokens=row.input_tokens,
                output_tokens=row.output_tokens,
                cost_inr=row.cost_inr,
            )
            for row in usage
        ]

        feedback = (
            await self._session.execute(
                text(
                    """
                    SELECT f.target_kind, f.target_id, f.signal, f.reasons,
                           f.correction, f.created_at
                      FROM ai.feedback f
                      JOIN ai.envelope e ON e.id = f.envelope_id
                     WHERE e.turn_id = CAST(:turn_id AS uuid)
                     ORDER BY f.created_at
                    """
                ),
                {"turn_id": str(turn_id)},
            )
        ).all()
        inspection.feedback = [
            {
                "target_kind": row.target_kind,
                "target_id": row.target_id,
                "signal": row.signal,
                "reasons": list(row.reasons or []),
                "correction": row.correction,
                "created_at": row.created_at,
            }
            for row in feedback
        ]

        return inspection

    async def _chunks(
        self,
        *,
        kept: list[tuple[uuid.UUID, float]],
        rejected: list[tuple[uuid.UUID, float]],
    ) -> list[InspectorChunk]:
        """Resolve logged chunk ids to their text, in retrieval order.

        One query for both sets. A chunk deleted since the turn simply does not
        come back, and the row is still shown with its score — "this answer
        cited something that no longer exists" is a finding, not a reason to
        render nothing.
        """
        scores = {chunk_id: (score, True) for chunk_id, score in kept}
        scores |= {chunk_id: (score, False) for chunk_id, score in rejected}
        if not scores:
            return []

        rows = (
            await self._session.execute(
                text(
                    """
                    SELECT c.id, c.document_id, d.title, c.heading_path, c.ordinal,
                           c.token_count, c.content
                      FROM rag.chunk c
                      LEFT JOIN rag.document d ON d.id = c.document_id
                     WHERE c.id = ANY(CAST(:ids AS uuid[]))
                    """
                ),
                {"ids": [str(chunk_id) for chunk_id in scores]},
            )
        ).all()
        found = {row.id: row for row in rows}

        resolved: list[InspectorChunk] = []
        for chunk_id, (score, kept_flag) in scores.items():
            row = found.get(chunk_id)
            resolved.append(
                InspectorChunk(
                    chunk_id=chunk_id,
                    document_id=row.document_id if row else None,
                    document_title=row.title if row else None,
                    heading_path=list(row.heading_path or []) if row else [],
                    ordinal=row.ordinal if row else None,
                    token_count=row.token_count if row else None,
                    content=row.content if row else "(this chunk no longer exists)",
                    score=float(score),
                    kept=kept_flag,
                )
            )

        # Kept first in retrieval order, then rejected by descending score —
        # the rejected list is read top-down looking for the one that should
        # have made it.
        resolved.sort(key=lambda c: (not c.kept, -c.score if not c.kept else 0))
        return resolved

    # ── Documents ───────────────────────────────────────────────────────────

    async def documents(
        self, *, tenant_id: uuid.UUID | None = None, status: str | None = None
    ) -> list[DocumentRow]:
        """Ingestion status with the actual error (§11).

        `DISTINCT ON` takes the newest job per document. A document that failed,
        was reprocessed and succeeded should read as ready, and an older failed
        job is history rather than the current state.
        """
        rows = (
            await self._session.execute(
                text(
                    """
                    SELECT d.id, d.tenant_id, ten.name AS tenant_name, d.title, d.doc_type,
                           d.status, d.page_count, d.created_at,
                           (SELECT count(*) FROM rag.chunk c WHERE c.document_id = d.id)
                               AS chunk_count,
                           j.status AS job_status, j.stage AS job_stage,
                           j.error AS job_error, COALESCE(j.attempts, 0) AS attempts
                      FROM rag.document d
                      JOIN core.tenant ten ON ten.id = d.tenant_id
                      LEFT JOIN LATERAL (
                          SELECT status, stage, error, attempts
                            FROM rag.ingestion_job ij
                           WHERE ij.document_id = d.id
                           ORDER BY ij.created_at DESC
                           LIMIT 1
                      ) j ON TRUE
                     WHERE d.deleted_at IS NULL
                       AND (CAST(:tenant_id AS uuid) IS NULL
                            OR d.tenant_id = CAST(:tenant_id AS uuid))
                       AND (CAST(:status AS text) IS NULL OR d.status = CAST(:status AS text))
                     ORDER BY (d.status = 'failed') DESC, d.created_at DESC
                     LIMIT 500
                    """
                ),
                {
                    "tenant_id": str(tenant_id) if tenant_id else None,
                    "status": status,
                },
            )
        ).all()

        return [
            DocumentRow(
                document_id=row.id,
                tenant_id=row.tenant_id,
                tenant_name=row.tenant_name,
                title=row.title,
                doc_type=row.doc_type,
                status=row.status,
                page_count=row.page_count,
                chunk_count=row.chunk_count,
                created_at=row.created_at,
                job_status=row.job_status,
                job_stage=row.job_stage,
                job_error=row.job_error,
                attempts=row.attempts,
            )
            for row in rows
        ]

    async def document_tenant(self, document_id: uuid.UUID) -> uuid.UUID | None:
        """Which tenant owns a document — the one thing reprocessing needs.

        Reprocessing has to run as the tenant, because `tenant_isolation` is the
        only policy governing writes and a staff session satisfies none of it.
        So the staff session's job is to answer this question and then step
        aside.
        """
        result = await self._session.execute(
            text(
                "SELECT tenant_id FROM rag.document "
                "WHERE id = CAST(:id AS uuid) AND deleted_at IS NULL"
            ),
            {"id": str(document_id)},
        )
        row = result.scalar_one_or_none()
        return uuid.UUID(str(row)) if row else None

    # ── Funnel ──────────────────────────────────────────────────────────────

    async def funnel(self, *, weeks: int = 8) -> list[FunnelWeek]:
        """Signup cohorts, by the week each user signed up (§11).

        Cohorted, not summed per week. "Six people uploaded a document this
        week" mixes cohorts and cannot tell you whether onboarding is improving;
        "of the eleven who signed up in week 30, six eventually uploaded" can.
        Which means the later columns are *ever*, not *that week* — a user who
        signed up in July and uploaded in August counts in July's row.

        `returned_week_two` is the honest retention signal at this stage: a
        session seen between 7 and 14 days after signup. Not a proxy for value,
        but it is the difference between a trial and a habit.
        """
        rows = (
            await self._session.execute(
                text(
                    """
                    WITH cohort AS (
                        SELECT u.id AS user_id,
                               date_trunc('week', u.created_at)::date AS week,
                               u.created_at,
                               u.email_verified_at
                          FROM core.user_account u
                         WHERE u.deleted_at IS NULL
                           AND u.created_at >= date_trunc('week', now())
                                               - CAST(:weeks || ' weeks' AS interval)
                    )
                    SELECT
                        c.week,
                        count(*) AS signed_up,
                        count(*) FILTER (WHERE c.email_verified_at IS NOT NULL) AS verified,
                        count(*) FILTER (WHERE EXISTS (
                            SELECT 1 FROM core.membership m
                             JOIN core.property p ON p.tenant_id = m.tenant_id
                                                 AND p.deleted_at IS NULL
                            WHERE m.user_id = c.user_id
                        )) AS created_property,
                        count(*) FILTER (WHERE EXISTS (
                            SELECT 1 FROM core.membership m
                             JOIN rag.document d ON d.tenant_id = m.tenant_id
                                                AND d.deleted_at IS NULL
                            WHERE m.user_id = c.user_id
                        )) AS uploaded_document,
                        count(*) FILTER (WHERE EXISTS (
                            SELECT 1 FROM ai.turn t WHERE t.user_id = c.user_id
                        )) AS asked_question,
                        count(*) FILTER (WHERE EXISTS (
                            SELECT 1 FROM core.session s
                             WHERE s.user_id = c.user_id
                               AND s.last_seen_at >= c.created_at + interval '7 days'
                               AND s.last_seen_at <  c.created_at + interval '14 days'
                        )) AS returned_week_two
                    FROM cohort c
                    GROUP BY c.week
                    ORDER BY c.week DESC
                    """
                ),
                {"weeks": str(weeks)},
            )
        ).all()

        return [
            FunnelWeek(
                week=row.week,
                signed_up=row.signed_up,
                verified=row.verified,
                created_property=row.created_property,
                uploaded_document=row.uploaded_document,
                asked_question=row.asked_question,
                returned_week_two=row.returned_week_two,
            )
            for row in rows
        ]

    # ── Cost ────────────────────────────────────────────────────────────────

    async def cost(
        self, *, days: int = 30, tenant_id: uuid.UUID | None = None
    ) -> list[CostRow]:
        """Spend per tenant per day, from the ledger (§11, §6.6).

        From `billing.usage_ledger` rather than summing `ai.turn.cost_inr`. The
        turn column is a denormalised total for the conversation list; the
        ledger has one row per *model call*, which is the only place that can
        say whether the money went on embedding, reranking or synthesis.
        """
        rows = (
            await self._session.execute(
                text(
                    """
                    SELECT date_trunc('day', l.occurred_at)::date AS day,
                           l.tenant_id, ten.name AS tenant_name,
                           sum(l.cost_inr) AS cost_inr,
                           sum(l.input_tokens) AS input_tokens,
                           sum(l.output_tokens) AS output_tokens,
                           count(*) AS calls
                      FROM billing.usage_ledger l
                      JOIN core.tenant ten ON ten.id = l.tenant_id
                     WHERE l.occurred_at >= now() - CAST(:days || ' days' AS interval)
                       AND (CAST(:tenant_id AS uuid) IS NULL
                            OR l.tenant_id = CAST(:tenant_id AS uuid))
                     GROUP BY day, l.tenant_id, ten.name
                     ORDER BY day DESC, cost_inr DESC
                    """
                ),
                {"days": str(days), "tenant_id": str(tenant_id) if tenant_id else None},
            )
        ).all()

        return [
            CostRow(
                day=row.day,
                tenant_id=row.tenant_id,
                tenant_name=row.tenant_name,
                cost_inr=row.cost_inr,
                input_tokens=row.input_tokens,
                output_tokens=row.output_tokens,
                calls=row.calls,
            )
            for row in rows
        ]


# ── Shared question filtering ───────────────────────────────────────────────
# One string used by both the page and its count, because a pager whose total
# is computed from a different predicate than its rows is worse than no pager.

_QUESTION_FILTERS = """
    (CAST(:tenant_id AS uuid) IS NULL OR t.tenant_id = CAST(:tenant_id AS uuid))
AND (CAST(:since AS timestamptz) IS NULL OR t.started_at >= CAST(:since AS timestamptz))
AND (CAST(:until AS timestamptz) IS NULL OR t.started_at < CAST(:until AS timestamptz))
AND (CAST(:status AS text) IS NULL OR t.status = CAST(:status AS text))
AND (
        CAST(:search AS text) IS NULL
     OR to_tsvector('english', t.input)
        @@ websearch_to_tsquery('english', CAST(:search AS text))
    )
"""


def _question_params(
    tenant_id: uuid.UUID | None,
    since: datetime | None,
    until: datetime | None,
    status: str | None,
    search: str | None,
) -> dict[str, Any]:
    return {
        "tenant_id": str(tenant_id) if tenant_id else None,
        "since": since,
        "until": until,
        "status": status,
        # An empty search box is not a search for the empty string.
        "search": search.strip() or None if search else None,
    }


def _question_row(row: Any) -> QuestionRow:
    return QuestionRow(
        turn_id=row.id,
        conversation_id=row.conversation_id,
        tenant_id=row.tenant_id,
        tenant_name=row.tenant_name,
        user_email=row.user_email,
        question=row.input,
        status=row.status,
        asked_at=row.started_at,
        latency_ms=row.latency_ms,
        cost_inr=row.cost_inr,
    )
