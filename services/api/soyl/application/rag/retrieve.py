"""Retrieval: query in, ranked chunks out.

    embed → three searches in parallel → RRF → threshold → top k

The threshold is the part worth arguing about. `UPDATE.md` §8 is explicit:

> The system must be allowed to return zero results and say "I don't have
> anything on that" rather than answering from a weak chunk.

That is the single most important behaviour in the product. A confident answer
assembled from the nearest three chunks to a question the corpus does not cover
is worse than no answer — it is the failure mode that makes people stop
trusting the whole thing, and it is invisible until someone acts on it.

So retrieval returns nothing when nothing clears the bar, and the pipeline
above it is built to treat that as a normal outcome rather than an error.
"""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from soyl.domain.ai.ports import EmbeddingProvider
from soyl.domain.rag.fusion import Fused, reciprocal_rank_fusion
from soyl.infrastructure.db.repositories.document_repository import vector_literal
from soyl.infrastructure.db.repositories.retrieval_repository import (
    Chunk,
    RetrievalRepository,
)

logger = logging.getLogger("soyl.rag.retrieve")

# How many chunks reach the model. §45.3 sizes the context at 8.
DEFAULT_TOP_K = 8

# The minimum fused score a chunk needs to be considered evidence at all.
#
# Provisional, and marked as such: §45.3 says these are "tuned against the
# labelled retrieval set rather than chosen by feel", and that set does not
# exist yet. This value is deliberately low — it exists to reject chunks that
# only one retriever found at the very bottom of its list, not to be a quality
# judgement it is not yet qualified to make. Raising it before the labelled set
# exists would be guessing with extra steps.
MIN_FUSED_SCORE = 1.0 / (60 + 40)


@dataclass(frozen=True, slots=True)
class RetrievalResult:
    """What retrieval found, and enough to explain why.

    `fused` is carried alongside the chunks because `ai.retrieval_log` records
    it and the M6 answer inspector renders it. §7: without that, "why did it
    give that answer" is unanswerable, and it is the question we will be asked
    most often.
    """

    chunks: list[Chunk]
    fused: list[Fused]
    query: str

    @property
    def found_nothing(self) -> bool:
        return not self.chunks


async def retrieve(
    session: AsyncSession,
    *,
    embeddings: EmbeddingProvider,
    query: str,
    property_ids: list[uuid.UUID] | None = None,
    top_k: int = DEFAULT_TOP_K,
    min_score: float = MIN_FUSED_SCORE,
) -> RetrievalResult:
    """Run the three retrievers, fuse, threshold, and return the survivors."""
    if not query.strip():
        return RetrievalResult(chunks=[], fused=[], query=query)

    embedded = await embeddings.embed([query])
    literal = vector_literal(embedded.vectors[0])

    repository = RetrievalRepository(session)

    # Sequential, not gathered. They share one session, and a SQLAlchemy
    # AsyncSession is not safe to use concurrently — `asyncio.gather` here
    # produces "another operation is in progress" under load and works fine in
    # a quiet test, which is the worst combination. Three index scans are
    # milliseconds; the embedding call above dominates the latency anyway.
    vector = await repository.vector_search(embedding=literal, property_ids=property_ids)
    lexical = await repository.lexical_search(query=query, property_ids=property_ids)
    questions = await repository.question_search(embedding=literal, property_ids=property_ids)

    fused = reciprocal_rank_fusion(
        {"vector": vector, "lexical": lexical, "questions": questions}
    )

    kept = [entry for entry in fused if entry.score >= min_score][:top_k]

    if not kept:
        logger.info(
            "retrieval found nothing above threshold query_len=%d candidates=%d",
            len(query),
            len(fused),
        )
        return RetrievalResult(chunks=[], fused=fused, query=query)

    chunks = await repository.load([entry.chunk_id for entry in kept])

    return RetrievalResult(chunks=chunks, fused=kept, query=query)
