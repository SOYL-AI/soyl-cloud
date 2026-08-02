"""The answer pipeline.

    guard → retrieve → synthesise → validate → persist

Linear, per `UPDATE.md` §9: *"No LangGraph in Phase 0 — there is no branching
worth a graph runtime yet."* The one branch that exists is the important one,
and it is an early return rather than a node.

**`understand` is deliberately not a stage.** §9 lists it as "one small
structured-output call resolving the question and its scope", and in Phase 0 it
would resolve a question against a scope that is already known: the tenant
comes from the session, the property scope from the membership, and there are
no date ranges or metrics to parse because there are no metrics. It would be a
model call that costs latency and money to restate its input. It earns its
place when there is scope worth resolving, and the `Intent` field is already on
the envelope so adding it later is additive.

**Nothing is thrown away on failure.** A turn row is written before the model
is called and updated to its terminal status afterwards, so a question that
crashed the pipeline is still in the permanent log (§6.5). The rows that record
what we could not answer are the most valuable ones in the table.
"""

from __future__ import annotations

import logging
import time
import uuid
from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from soyl.application.rag.retrieve import RetrievalResult, retrieve
from soyl.domain.ai.assembly import assemble
from soyl.domain.ai.envelope import DraftAnswer, DraftBlock, Envelope
from soyl.domain.ai.envelope import Usage as EnvelopeUsage
from soyl.domain.ai.ports import (
    AnswerProvider,
    EmbeddingProvider,
    ProviderError,
    RerankProvider,
    Usage,
)
from soyl.infrastructure.db.repositories.answer_repository import AnswerRepository
from soyl.infrastructure.db.session import tenant_session

logger = logging.getLogger("soyl.ai.answer")

# Long enough for a real question, short enough that a pasted document is
# rejected rather than embedded. §9's guard stage.
MAX_QUESTION_CHARS = 2000
MIN_QUESTION_CHARS = 2


class AnswerRefused(Exception):
    """The guard rejected the input before anything was spent on it."""


@dataclass(frozen=True, slots=True)
class AnswerOutcome:
    envelope: Envelope
    turn_id: uuid.UUID
    conversation_id: uuid.UUID


def _no_evidence_draft(question: str) -> DraftAnswer:
    """The refusal, written here rather than asked of a model.

    §9: *"Refusal is a valid, well-designed outcome... and should look
    deliberate, not like an error."* Deterministic because there is nothing to
    synthesise — spending a model call to phrase "I don't know" would make the
    cheapest outcome cost the same as the most expensive one, and would give
    the model an opportunity to answer anyway.
    """
    return DraftAnswer(
        headline="No document covers that.",
        blocks=[
            DraftBlock(
                type="alert.callout",
                level="info",
                markdown=(
                    "Nothing in your uploaded documents answers this question. "
                    "That is not a failed search — the system is built to say so "
                    "rather than answer from a weakly related passage.\n\n"
                    "Try naming the policy or document you expect it to be in, or "
                    "upload the document that covers it."
                ),
            )
        ],
        followups=[],
    )


async def answer_question(
    factory: async_sessionmaker[AsyncSession],
    *,
    embeddings: EmbeddingProvider,
    answers: AnswerProvider,
    reranker: RerankProvider | None,
    tenant_id: uuid.UUID,
    user_id: uuid.UUID,
    question: str,
    conversation_id: uuid.UUID | None = None,
    property_ids: list[uuid.UUID] | None = None,
    idempotency_key: str | None = None,
) -> AnswerOutcome:
    """One question, one turn, one envelope."""
    started = time.perf_counter()
    question = question.strip()

    # ── guard ───────────────────────────────────────────────────────────────
    if len(question) < MIN_QUESTION_CHARS:
        raise AnswerRefused("Ask a question.")
    if len(question) > MAX_QUESTION_CHARS:
        raise AnswerRefused(
            f"That is {len(question)} characters. Questions are limited to "
            f"{MAX_QUESTION_CHARS}; upload long text as a document instead."
        )

    async with tenant_session(factory, tenant_id) as session:
        repository = AnswerRepository(session)
        conversation_id = await repository.ensure_conversation(
            conversation_id=conversation_id, user_id=user_id, title=question
        )
        # Written before anything is spent, so a crash below still leaves the
        # question in the permanent log.
        turn_id = await repository.start_turn(
            conversation_id=conversation_id,
            user_id=user_id,
            question=question,
            idempotency_key=idempotency_key,
        )

    usages: list[Usage] = []
    warnings: list[str] = []

    try:
        # ── retrieve ────────────────────────────────────────────────────────
        async with tenant_session(factory, tenant_id) as session:
            retrieval = await retrieve(
                session,
                embeddings=embeddings,
                reranker=reranker,
                query=question,
                property_ids=property_ids,
            )
        usages.extend(retrieval.usage)

        if retrieval.rerank_skipped_reason:
            warnings.append(f"reranking was skipped ({retrieval.rerank_skipped_reason})")

        # ── synthesise ──────────────────────────────────────────────────────
        if retrieval.found_nothing:
            # §9: do not proceed to synthesis with weak context. There is no
            # context at all here, so there is nothing to be tempted by.
            draft = _no_evidence_draft(question)
        else:
            draft, usage = await answers.synthesise(
                question=question, chunks=retrieval.chunks
            )
            usages.append(usage)

        # ── validate and assemble ───────────────────────────────────────────
        envelope, strips = assemble(
            draft,
            turn_id=turn_id,
            conversation_id=conversation_id,
            tenant_id=tenant_id,
            question=question,
            chunks=retrieval.chunks,
            scores=retrieval.scores,
            property_ids=property_ids,
            reranked=retrieval.reranked,
            had_evidence=not retrieval.found_nothing,
            usage=_totals(usages, started),
            warnings=warnings,
        )

        for strip in strips:
            # §6.4 requires the strip to be logged. At WARNING because a model
            # citing a chunk it was never given is the failure this system
            # exists to prevent, and it should be visible without being asked
            # for.
            logger.warning(
                "stripped block turn=%s type=%s reason=%s",
                turn_id,
                strip.block_type,
                strip.reason,
            )

    except ProviderError as error:
        async with tenant_session(factory, tenant_id) as session:
            await AnswerRepository(session).fail_turn(turn_id=turn_id, reason=str(error))
        raise

    # ── persist ─────────────────────────────────────────────────────────────
    async with tenant_session(factory, tenant_id) as session:
        repository = AnswerRepository(session)
        await repository.save_envelope(envelope, draft=draft, strips=strips)
        await repository.log_retrieval(
            turn_id=turn_id,
            retrieval=retrieval,
            property_ids=property_ids,
            latency_ms=int((time.perf_counter() - started) * 1000),
        )
        await repository.record_usage(turn_id=turn_id, user_id=user_id, usages=usages)
        await repository.complete_turn(
            turn_id=turn_id,
            envelope_id=envelope.envelope_id,
            status=envelope.status,
            usage=envelope.diagnostics.usage,
        )

    logger.info(
        "answered turn=%s status=%s chunks=%d blocks=%d cost_inr=%.4f",
        turn_id,
        envelope.status,
        len(retrieval.chunks),
        len(envelope.blocks),
        envelope.diagnostics.usage.cost_inr,
    )

    return AnswerOutcome(
        envelope=envelope, turn_id=turn_id, conversation_id=conversation_id
    )


def _totals(usages: list[Usage], started: float) -> EnvelopeUsage:
    return EnvelopeUsage(
        input_tokens=sum(u.input_tokens for u in usages),
        output_tokens=sum(u.output_tokens for u in usages),
        # Summed from the calls rather than left at zero. Each adapter prices
        # its own call, because the price belongs next to the model that has it.
        cost_inr=float(sum((u.cost_inr for u in usages), Decimal(0))),
        wall_ms=int((time.perf_counter() - started) * 1000),
    )


__all__ = ["AnswerOutcome", "AnswerRefused", "RetrievalResult", "answer_question"]
