"""Persistence for conversations, turns, envelopes, retrieval logs and usage.

No `tenant_id` in any WHERE clause. The session carries it and RLS applies it,
exactly as everywhere else — a second copy here could drift from the policy and
would mask a missing one in the isolation suite.

Writes do pass `tenant_id` in their column lists, because a policy's `WITH
CHECK` needs a value to check and NOT NULL needs one to store. That is the
policy validating what we wrote, not us deciding what we can see.
"""

from __future__ import annotations

import json
import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text

from soyl.application.rag.retrieve import RetrievalResult
from soyl.domain.ai.envelope import DraftAnswer, Envelope
from soyl.domain.ai.envelope import Usage as EnvelopeUsage
from soyl.domain.ai.ports import Usage
from soyl.domain.ai.validation import Strip

# A conversation is listed by its first question. Long enough to recognise,
# short enough not to wrap in a sidebar.
TITLE_CHARS = 80


@dataclass(frozen=True, slots=True)
class ConversationRow:
    id: uuid.UUID
    title: str | None
    turn_count: int
    last_turn_at: datetime | None
    created_at: datetime


@dataclass(frozen=True, slots=True)
class TurnRow:
    turn_id: uuid.UUID
    question: str
    status: str
    asked_at: datetime
    # Null for a turn that failed before synthesis. A normal record, not a
    # broken one, and dropping it would make the history disagree with what the
    # user remembers asking.
    envelope: dict[str, Any] | None


class AnswerRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def ensure_conversation(
        self, *, conversation_id: uuid.UUID | None, user_id: uuid.UUID, title: str
    ) -> uuid.UUID:
        """Return the conversation to append to, creating one if needed.

        A supplied id that does not exist — or belongs to another tenant, which
        RLS makes indistinguishable — starts a new conversation rather than
        raising. The alternative is a user losing a question to an error about
        an identifier they never saw.
        """
        if conversation_id is not None:
            found = (
                await self._session.execute(
                    text(
                        "SELECT id FROM ai.conversation "
                        "WHERE id = :id AND deleted_at IS NULL"
                    ),
                    {"id": conversation_id},
                )
            ).scalar_one_or_none()
            if found is not None:
                return conversation_id

        row = (
            await self._session.execute(
                text(
                    "INSERT INTO ai.conversation (tenant_id, user_id, title) "
                    "VALUES (NULLIF(current_setting('app.tenant_id', TRUE), '')::uuid, "
                    ":user_id, :title) RETURNING id"
                ),
                {"user_id": user_id, "title": title[:TITLE_CHARS]},
            )
        ).scalar_one()
        return uuid.UUID(str(row))

    async def start_turn(
        self,
        *,
        conversation_id: uuid.UUID,
        user_id: uuid.UUID,
        question: str,
        idempotency_key: str | None = None,
    ) -> uuid.UUID:
        """Record the question before anything is spent answering it.

        §6.5 wants every question permanently, which has to include the ones
        that then fail. Writing the row after the answer would lose exactly the
        turns worth studying.
        """
        row = (
            await self._session.execute(
                text(
                    """
                    INSERT INTO ai.turn
                        (conversation_id, tenant_id, user_id, input, status, idempotency_key)
                    VALUES
                        (:conversation_id,
                         NULLIF(current_setting('app.tenant_id', TRUE), '')::uuid,
                         :user_id, :input, 'running', :idempotency_key)
                    RETURNING id
                    """
                ),
                {
                    "conversation_id": conversation_id,
                    "user_id": user_id,
                    "input": question,
                    "idempotency_key": idempotency_key,
                },
            )
        ).scalar_one()
        return uuid.UUID(str(row))

    async def save_envelope(
        self,
        envelope: Envelope,
        *,
        draft: DraftAnswer | None = None,
        strips: list[Strip] | None = None,
    ) -> None:
        """The envelope, and the evidence for how it got that way.

        `draft` and `strips` are what the M6 answer inspector reads (§11: "the
        raw model output, what validation stripped"). M4 logged both and stored
        neither, which meant the one question the inspector exists to answer —
        *why did it say that* — was answerable only for as long as the
        application log was retained.

        Both default to None so the two failure paths that call this without a
        draft do not have to invent one.
        """
        body = envelope.model_dump(mode="json")
        serialised = _dumps(body)
        await self._session.execute(
            text(
                """
                INSERT INTO ai.envelope
                    (id, tenant_id, turn_id, version, body, size_bytes, draft, strips)
                VALUES (:id, NULLIF(current_setting('app.tenant_id', TRUE), '')::uuid,
                        :turn_id, :version, CAST(:body AS jsonb), :size_bytes,
                        CAST(:draft AS jsonb), CAST(:strips AS jsonb))
                """
            ),
            {
                "id": envelope.envelope_id,
                "turn_id": envelope.turn_id,
                "version": envelope.version,
                "body": serialised,
                # The stored size is the envelope the client receives, not the
                # row. `draft` is diagnostic weight nobody is billed for and
                # counting it would make the number mean two things.
                "size_bytes": len(serialised.encode()),
                "draft": _dumps(draft.model_dump(mode="json")) if draft is not None else None,
                "strips": _dumps(
                    [
                        {
                            "block_id": strip.block_id,
                            "block_type": strip.block_type,
                            "reason": strip.reason,
                        }
                        for strip in (strips or [])
                    ]
                ),
            },
        )

    async def log_retrieval(
        self,
        *,
        turn_id: uuid.UUID,
        retrieval: RetrievalResult,
        property_ids: list[uuid.UUID] | None,
        latency_ms: int,
    ) -> None:
        """§7: not optional.

        The rejected chunks are stored alongside the kept ones because "we
        found it and scored it 0.20" and "we never found it" are different
        failures, and from outside both look like an empty answer.
        """
        filters = {
            "property_ids": [str(p) for p in property_ids] if property_ids else [],
        }
        await self._session.execute(
            text(
                """
                INSERT INTO ai.retrieval_log
                    (turn_id, tenant_id, query, filters, chunk_ids, scores,
                     rejected_ids, rejected_scores, reranked, latency_ms)
                VALUES
                    (:turn_id, NULLIF(current_setting('app.tenant_id', TRUE), '')::uuid,
                     :query, CAST(:filters AS jsonb),
                     CAST(:chunk_ids AS uuid[]), CAST(:scores AS real[]),
                     CAST(:rejected_ids AS uuid[]), CAST(:rejected_scores AS real[]),
                     :reranked, :latency_ms)
                """
            ),
            {
                "turn_id": turn_id,
                "query": retrieval.query,
                "filters": _dumps(filters),
                "chunk_ids": [c.chunk_id for c in retrieval.chunks],
                # The constraint requires these to align. Retrieval without a
                # reranker returns no scores, so pad rather than write a row the
                # check would reject.
                "scores": _aligned(retrieval.scores, len(retrieval.chunks)),
                "rejected_ids": [chunk_id for chunk_id, _ in retrieval.dropped],
                "rejected_scores": [score for _, score in retrieval.dropped],
                "reranked": retrieval.reranked,
                "latency_ms": latency_ms,
            },
        )

    async def record_usage(
        self, *, turn_id: uuid.UUID, user_id: uuid.UUID, usages: list[Usage]
    ) -> None:
        """One ledger row per model call (§6.6).

        Per call rather than per turn: a turn that embedded, reranked and
        synthesised spent money three times on three models at three prices,
        and a single summed row cannot answer which of them is expensive.
        """
        for usage in usages:
            await self._session.execute(
                text(
                    """
                    INSERT INTO billing.usage_ledger
                        (tenant_id, user_id, turn_id, kind, provider, model,
                         input_tokens, output_tokens, cached_tokens, units, cost_inr)
                    VALUES
                        (NULLIF(current_setting('app.tenant_id', TRUE), '')::uuid,
                         :user_id, :turn_id, :kind, :provider, :model,
                         :input_tokens, :output_tokens, :cached_tokens, :units, :cost_inr)
                    """
                ),
                {
                    "user_id": user_id,
                    "turn_id": turn_id,
                    "kind": _kind(usage),
                    "provider": usage.provider,
                    "model": usage.model,
                    "input_tokens": usage.input_tokens,
                    "output_tokens": usage.output_tokens,
                    "cached_tokens": usage.cached_tokens,
                    "units": usage.units,
                    # Until M6 this column was omitted and defaulted to zero,
                    # so the ledger held tokens and no money. §11's cost screen
                    # is the thing that could not have worked.
                    "cost_inr": usage.cost_inr,
                },
            )

    async def complete_turn(
        self,
        *,
        turn_id: uuid.UUID,
        envelope_id: uuid.UUID,
        status: str,
        usage: EnvelopeUsage,
    ) -> None:
        await self._session.execute(
            text(
                """
                UPDATE ai.turn
                   SET status = :status,
                       envelope_id = :envelope_id,
                       input_tokens = :input_tokens,
                       output_tokens = :output_tokens,
                       cost_inr = :cost_inr,
                       latency_ms = :latency_ms,
                       completed_at = now()
                 WHERE id = :id
                """
            ),
            {
                "id": turn_id,
                "status": status,
                "envelope_id": envelope_id,
                "input_tokens": usage.input_tokens,
                "output_tokens": usage.output_tokens,
                "cost_inr": usage.cost_inr,
                "latency_ms": usage.wall_ms,
            },
        )
        await self._touch_conversation(turn_id)

    async def fail_turn(self, *, turn_id: uuid.UUID, reason: str) -> None:
        """Mark a turn failed without losing the question that caused it."""
        await self._session.execute(
            text(
                "UPDATE ai.turn SET status = 'failed', completed_at = now(), "
                "trace_id = COALESCE(trace_id, :reason) WHERE id = :id"
            ),
            {"id": turn_id, "reason": reason[:200]},
        )
        await self._touch_conversation(turn_id)

    async def _touch_conversation(self, turn_id: uuid.UUID) -> None:
        await self._session.execute(
            text(
                """
                UPDATE ai.conversation c
                   SET turn_count = c.turn_count + 1, last_turn_at = now()
                  FROM ai.turn t
                 WHERE t.id = :turn_id AND c.id = t.conversation_id
                """
            ),
            {"turn_id": turn_id},
        )

    async def list_conversations(self, *, limit: int = 30) -> list[ConversationRow]:
        """Most recently active first.

        Scoped to the tenant by RLS, not to the user: a duty manager who asked
        something on the late shift and a general manager reading it the next
        morning are the same workspace. Per-user history would hide the answer
        from the person it was escalated to.
        """
        rows = (
            await self._session.execute(
                text(
                    """
                    SELECT id, title, turn_count, last_turn_at, created_at
                      FROM ai.conversation
                     WHERE deleted_at IS NULL AND turn_count > 0
                     ORDER BY last_turn_at DESC NULLS LAST
                     LIMIT :limit
                    """
                ),
                {"limit": limit},
            )
        ).all()

        return [
            ConversationRow(
                id=row.id,
                title=row.title,
                turn_count=row.turn_count,
                last_turn_at=row.last_turn_at,
                created_at=row.created_at,
            )
            for row in rows
        ]

    async def load_conversation(self, conversation_id: uuid.UUID) -> list[TurnRow]:
        """Every turn, with its envelope where there is one.

        A LEFT JOIN rather than an inner one: a turn that failed has no
        envelope, and dropping it from the history would make the record of
        what happened disagree with what the user remembers asking.
        """
        rows = (
            await self._session.execute(
                text(
                    """
                    SELECT t.id, t.input, t.status, t.started_at, e.body
                      FROM ai.turn t
                      LEFT JOIN ai.envelope e ON e.turn_id = t.id
                     WHERE t.conversation_id = :id
                     ORDER BY t.started_at
                    """
                ),
                {"id": conversation_id},
            )
        ).all()

        return [
            TurnRow(
                turn_id=row.id,
                question=row.input,
                status=row.status,
                asked_at=row.started_at,
                envelope=row.body,
            )
            for row in rows
        ]

    async def load_envelope(self, turn_id: uuid.UUID) -> dict[str, Any] | None:
        row = (
            await self._session.execute(
                text("SELECT body FROM ai.envelope WHERE turn_id = :turn_id"),
                {"turn_id": turn_id},
            )
        ).scalar_one_or_none()
        return row


def _kind(usage: Usage) -> str:
    """Map a provider call onto the ledger's `kind` check constraint."""
    model = (usage.model or "").lower()
    if "embed" in model:
        return "embed"
    if "rerank" in model:
        return "rerank"
    return "llm"


def _aligned(scores: list[float], count: int) -> list[float]:
    """Pad or trim so the row satisfies `ck_retrieval_log_scores_align`."""
    if len(scores) == count:
        return scores
    return (scores + [0.0] * count)[:count]


def _dumps(value: object) -> str:
    """`default=str` because UUIDs and datetimes reach here already serialised
    by Pydantic, but the filters dict is built by hand and is easy to get
    wrong. Failing to serialise a log is not worth failing an answer over."""
    return json.dumps(value, default=str)
