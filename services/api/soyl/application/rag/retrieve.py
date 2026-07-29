"""Retrieval: query in, ranked chunks out.

    embed → three searches → RRF → load top 30 → rerank → threshold → top 8

The threshold is the part worth arguing about. `UPDATE.md` §8 is explicit:

> The system must be allowed to return zero results and say "I don't have
> anything on that" rather than answering from a weak chunk.

That is the single most important behaviour in the product. A confident answer
assembled from the nearest three chunks to a question the corpus does not cover
is worse than no answer — it is the failure mode that makes people stop
trusting the whole thing, and it is invisible until someone acts on it.

So retrieval returns nothing when nothing clears the bar, and the pipeline
above it is built to treat that as a normal outcome rather than an error.

**Reranking is optional at every call.** It is a quality stage, not a
correctness one: if the provider is slow, down, or absent, retrieval degrades
to fusion order and says so in the result rather than failing. §45.3 requires
exactly that, and the annotation is what stops a silent degradation from
looking like a quality regression nobody can explain.
"""

from __future__ import annotations

import asyncio
import logging
import time
import uuid
from dataclasses import dataclass, field

from sqlalchemy.ext.asyncio import AsyncSession

from soyl.domain.ai.ports import (
    EmbeddingProvider,
    ProviderError,
    Ranked,
    RerankProvider,
    Usage,
)
from soyl.domain.rag.fusion import Fused, reciprocal_rank_fusion
from soyl.domain.rag.retrieval import RetrievedChunk
from soyl.infrastructure.db.repositories.document_repository import vector_literal
from soyl.infrastructure.db.repositories.retrieval_repository import RetrievalRepository

logger = logging.getLogger("soyl.rag.retrieve")

# How many chunks reach the model. §45.3: what fits the context budget after
# neighbour expansion.
DEFAULT_TOP_K = 8

# How many the reranker gets to look at. §45.3: "below ~20 the reranker has
# nothing to fix; above ~40 latency grows without recall benefit at our corpus
# size."
RERANK_CANDIDATES = 30

# §45.3's normalised score threshold. Chunks below it are dropped even if they
# are in the top 8 — returning 8 weak chunks is worse than returning 3 strong
# ones, because it dilutes the context and invites the model to reach for a
# marginally relevant policy.
MIN_RERANK_SCORE = 0.25

# The minimum fused score a chunk needs to be a *candidate*.
#
# Deliberately low, and it is not the quality gate — `MIN_RERANK_SCORE` is.
# This only rejects chunks a single retriever found at the very bottom of its
# list, which the reranker would spend tokens on and then discard anyway.
MIN_FUSED_SCORE = 1.0 / (60 + 40)

# How long reranking gets before retrieval gives up and uses fusion order.
#
# **Not the handbook's 400ms.** §45.3 budgets 400ms p95, which is a
# cross-encoder number — one forward pass over 30 short pairs. We are on that
# section's documented fallback, an LLM listwise rerank, which takes seconds.
# Holding it to 400ms would time out on every request and leave a reranker that
# looked alive and never ran. This is a circuit breaker against a hung
# provider, not a latency target; the target returns to 400ms with a real
# cross-encoder.
RERANK_BUDGET_SECONDS = 12.0


@dataclass(frozen=True, slots=True)
class RetrievalResult:
    """What retrieval found, and enough to explain why.

    `fused` is carried alongside the chunks because `ai.retrieval_log` records
    it and the M6 answer inspector renders it. §7: without that, "why did it
    give that answer" is unanswerable, and it is the question we will be asked
    most often.
    """

    chunks: list[RetrievedChunk]
    fused: list[Fused]
    query: str
    # Post-rerank scores, aligned with `chunks`. Empty when reranking was
    # skipped, which is how a reader tells "the reranker scored this 0.9" from
    # "the reranker never ran".
    scores: list[float] = field(default_factory=list)
    # Chunks the reranker scored and the threshold rejected, as (id, score).
    #
    # "We never found it" and "we found it and judged it too weak" are different
    # failures with different fixes — one is a retriever problem, the other a
    # calibration problem — and from the outside both look like an empty answer.
    # Without this the two are indistinguishable, which is how a mis-set
    # threshold gets debugged as a broken retriever.
    dropped: list[tuple[uuid.UUID, float]] = field(default_factory=list)
    # False when the reranker was absent, too slow, or failed. §45.3 requires
    # the annotation: a silent degradation looks like a quality regression
    # nobody can account for.
    reranked: bool = False
    # Why, when `reranked` is False and a reranker was supplied.
    rerank_skipped_reason: str | None = None
    # Everything spent answering this query, for `billing.usage_ledger`.
    usage: list[Usage] = field(default_factory=list)

    @property
    def found_nothing(self) -> bool:
        return not self.chunks


async def retrieve(
    session: AsyncSession,
    *,
    embeddings: EmbeddingProvider,
    query: str,
    reranker: RerankProvider | None = None,
    property_ids: list[uuid.UUID] | None = None,
    top_k: int = DEFAULT_TOP_K,
    min_score: float = MIN_FUSED_SCORE,
    min_rerank_score: float = MIN_RERANK_SCORE,
) -> RetrievalResult:
    """Run the three retrievers, fuse, rerank, threshold, and return survivors."""
    if not query.strip():
        return RetrievalResult(chunks=[], fused=[], query=query)

    embedded = await embeddings.embed([query])
    literal = vector_literal(embedded.vectors[0])
    usage = [embedded.usage]

    repository = RetrievalRepository(session)

    # Sequential, not gathered. They share one session, and a SQLAlchemy
    # AsyncSession is not safe to use concurrently — `asyncio.gather` here
    # produces "another operation is in progress" under load and works fine in
    # a quiet test, which is the worst combination. Three index scans are
    # milliseconds; the embedding call above dominates the latency anyway.
    vector = await repository.vector_search(embedding=literal, property_ids=property_ids)
    lexical = await repository.lexical_search(query=query, property_ids=property_ids)
    questions = await repository.question_search(embedding=literal, property_ids=property_ids)

    fused = reciprocal_rank_fusion({"vector": vector, "lexical": lexical, "questions": questions})

    # Cut to the reranker's window before loading, not after: loading all of a
    # large corpus to discard most of it is the whole cost of the query.
    candidates = [entry for entry in fused if entry.score >= min_score][:RERANK_CANDIDATES]

    if not candidates:
        logger.info(
            "retrieval found nothing above the candidate floor query_len=%d fused=%d",
            len(query),
            len(fused),
        )
        return RetrievalResult(chunks=[], fused=fused, query=query, usage=usage)

    chunks = await repository.load([entry.chunk_id for entry in candidates])

    if reranker is None:
        return RetrievalResult(
            chunks=chunks[:top_k],
            fused=candidates[:top_k],
            query=query,
            usage=usage,
        )

    ranked, reason, rerank_usage = await _rerank(reranker, query=query, chunks=chunks, top_n=top_k)
    usage.extend(rerank_usage)

    if ranked is None:
        # §45.3: skipped for this turn, fusion order used, annotated. The
        # candidate floor is the only gate left, which is weaker than we would
        # like — and that is precisely why it is recorded rather than hidden.
        logger.warning("rerank skipped, using fusion order: %s", reason)
        return RetrievalResult(
            chunks=chunks[:top_k],
            fused=candidates[:top_k],
            query=query,
            reranked=False,
            rerank_skipped_reason=reason,
            usage=usage,
        )

    kept = [item for item in ranked if item.score >= min_rerank_score]
    dropped = [
        (chunks[item.index].chunk_id, item.score)
        for item in ranked
        if item.score < min_rerank_score
    ]

    if not kept:
        logger.info(
            "nothing cleared the rerank threshold query_len=%d best=%.3f threshold=%.2f",
            len(query),
            max((item.score for item in ranked), default=0.0),
            min_rerank_score,
        )

    # Keyed, not zipped: `load` drops any chunk deleted between the search
    # and the load, and a zip would then pair every later chunk with the wrong
    # fusion entry — misattributing the evidence rather than failing.
    by_id = {entry.chunk_id: entry for entry in candidates}

    ordered_chunks = [chunks[item.index] for item in kept]

    return RetrievalResult(
        chunks=ordered_chunks,
        fused=[by_id[chunk.chunk_id] for chunk in ordered_chunks],
        query=query,
        scores=[item.score for item in kept],
        dropped=dropped,
        reranked=True,
        usage=usage,
    )


async def _rerank(
    reranker: RerankProvider,
    *,
    query: str,
    chunks: list[RetrievedChunk],
    top_n: int,
) -> tuple[list[Ranked] | None, str | None, list[Usage]]:
    """Rerank within the budget, or report why not.

    Never raises. Every failure here is a quality loss, not a correctness one —
    the caller has a usable ranking either way, and turning a slow reranker
    into a failed question would be the wrong trade in a product whose value is
    answering the question.
    """
    # The header goes in because relevance depends on it: "Section: Cancellation
    # and refunds" is often the strongest signal a passage carries, and the
    # chunk body alone can read as generic prose without it.
    documents = [
        f"{chunk.context_header}\n{chunk.content}" if chunk.context_header else chunk.content
        for chunk in chunks
    ]

    started = time.perf_counter()
    try:
        result = await asyncio.wait_for(
            reranker.rerank(query=query, documents=documents, top_n=top_n),
            timeout=RERANK_BUDGET_SECONDS,
        )
    except TimeoutError:
        return None, f"exceeded the {RERANK_BUDGET_SECONDS:.0f}s budget", []
    except ProviderError as exc:
        return None, f"provider error: {exc}", []

    elapsed_ms = (time.perf_counter() - started) * 1000
    logger.info("reranked %d candidates in %.0fms", len(documents), elapsed_ms)

    # Trust the port's contract, but not with an index. A fabricated one is
    # either a crash or — with a negative index — a citation quietly pointing
    # at the passage at the other end of the list.
    valid = [item for item in result.results if 0 <= item.index < len(chunks)]
    if len(valid) != len(result.results):
        logger.warning("reranker returned out-of-range indices; %d dropped",
                       len(result.results) - len(valid))

    return valid, None, [result.usage]
