"""The three searches that feed fusion.

Handbook §45.1: vector, lexical, and the hypothetical-question index, run in
parallel and fused with RRF. Each returns a ranked list; none of them decides
anything.

**Pre-filtering is not optional** (§45.2). Every filter — tenant, property
scope, validity window, document status — is applied *inside* the query,
before the top-k cut. Post-filtering a top-50 vector search can return fewer
than 50 valid rows, or none, and the failure is silent: you get a worse answer
rather than an error.

`tenant_id` is not among those filters, and its absence is the point. The
session carries it and RLS applies it, exactly as everywhere else. A `WHERE
tenant_id = ...` here would be a second copy of the rule that could drift from
the policy — and would mask a missing policy in tests, which is the one failure
this design exists to make impossible.
"""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text

from soyl.domain.rag.fusion import Retrieved
from soyl.domain.rag.retrieval import RetrievedChunk

# Per-retriever depth, from §45.1's diagram. Deeper than the final context
# needs, because fusion's value is in the disagreement between lists.
VECTOR_LIMIT = 50
LEXICAL_LIMIT = 50
QUESTION_LIMIT = 25


# Applied to every retriever. Kept as one string so the three queries cannot
# drift into filtering differently, which would make fusion compare lists drawn
# from different populations.
_FILTERS = """
    d.deleted_at IS NULL
    AND d.status = 'ready'
    -- §8: a superseded 2023 policy is worse than no policy.
    AND (c.effective_from IS NULL OR c.effective_from <= CURRENT_DATE)
    AND (c.expires_on IS NULL OR c.expires_on >= CURRENT_DATE)
    -- An empty property_ids means tenant-wide: a group policy nobody has
    -- narrowed to one hotel. It must stay visible to every property.
    --
    -- Both mentions are cast. Postgres can infer a parameter's type from the
    -- operator it is used with, but `:property_ids IS NULL` gives it nothing to
    -- infer from, and asyncpg refuses with "could not determine data type"
    -- rather than guessing. The cast is what makes the unscoped case — the
    -- common one — work at all.
    AND (
        CAST(:property_ids AS uuid[]) IS NULL
        OR cardinality(c.property_ids) = 0
        OR c.property_ids && CAST(:property_ids AS uuid[])
    )
"""


class RetrievalRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def vector_search(
        self, *, embedding: str, property_ids: list[uuid.UUID] | None, limit: int = VECTOR_LIMIT
    ) -> list[Retrieved]:
        """Nearest neighbours by cosine distance, over the HNSW index.

        Returns similarity rather than distance so a higher score is better in
        every retriever, which stops a comparison being accidentally inverted.
        """
        rows = (
            await self._session.execute(
                text(
                    f"""
                    SELECT c.id, 1 - (c.embedding <=> CAST(:embedding AS vector)) AS score
                    FROM rag.chunk c
                    JOIN rag.document d ON d.id = c.document_id
                    WHERE c.embedding IS NOT NULL AND {_FILTERS}
                    ORDER BY c.embedding <=> CAST(:embedding AS vector)
                    LIMIT :limit
                    """  # noqa: S608 - no user input; :params are bound
                ),
                {"embedding": embedding, "property_ids": property_ids, "limit": limit},
            )
        ).all()

        return [Retrieved(chunk_id=row.id, score=float(row.score)) for row in rows]

    async def lexical_search(
        self, *, query: str, property_ids: list[uuid.UUID] | None, limit: int = LEXICAL_LIMIT
    ) -> list[Retrieved]:
        """Full-text search over the generated `content_tsv`.

        This is the half of hybrid retrieval that vector search cannot do:
        exact identifiers. A contract number, a vendor name, a rate code — a
        query for "the Marriott corporate agreement" needs the literal token
        "Marriott", and an embedding will happily return a different chain's
        agreement that is semantically identical.

        `websearch_to_tsquery` rather than `plainto_tsquery` because it accepts
        what people actually type — quoted phrases, `or`, leading minus — and
        never raises on syntax, which `to_tsquery` does.
        """
        rows = (
            await self._session.execute(
                text(
                    f"""
                    SELECT c.id, ts_rank_cd(c.content_tsv, q) AS score
                    FROM rag.chunk c
                    JOIN rag.document d ON d.id = c.document_id,
                         websearch_to_tsquery('english', :query) AS q
                    WHERE c.content_tsv @@ q AND {_FILTERS}
                    ORDER BY score DESC
                    LIMIT :limit
                    """  # noqa: S608 - no user input; :params are bound
                ),
                {"query": query, "property_ids": property_ids, "limit": limit},
            )
        ).all()

        return [Retrieved(chunk_id=row.id, score=float(row.score)) for row in rows]

    async def question_search(
        self, *, embedding: str, property_ids: list[uuid.UUID] | None, limit: int = QUESTION_LIMIT
    ) -> list[Retrieved]:
        """Nearest neighbours among the hypothetical questions (§43.2).

        A question embeds far closer to another question than to the prose that
        answers it, so this is the retriever that closes the gap between "can I
        cancel free?" and a clause about penalties.

        `DISTINCT ON` because several questions map to one chunk and a chunk
        should get one vote per retriever — fusion assumes exactly that.
        """
        rows = (
            await self._session.execute(
                text(
                    f"""
                    SELECT DISTINCT ON (c.id)
                           c.id, 1 - (q.embedding <=> CAST(:embedding AS vector)) AS score
                    FROM rag.chunk_question q
                    JOIN rag.chunk c ON c.id = q.chunk_id
                    JOIN rag.document d ON d.id = c.document_id
                    WHERE q.embedding IS NOT NULL AND {_FILTERS}
                    ORDER BY c.id, q.embedding <=> CAST(:embedding AS vector)
                    LIMIT :limit
                    """  # noqa: S608 - no user input; :params are bound
                ),
                {"embedding": embedding, "property_ids": property_ids, "limit": limit},
            )
        ).all()

        # DISTINCT ON forces ordering by c.id first, so the rows arrive grouped
        # rather than ranked. Sorting here restores the ranking fusion needs.
        results = [Retrieved(chunk_id=row.id, score=float(row.score)) for row in rows]
        results.sort(key=lambda item: -item.score)
        return results

    async def load(self, chunk_ids: list[uuid.UUID]) -> list[RetrievedChunk]:
        """Fetch the chunks fusion selected, in the order it selected them.

        Postgres returns rows in whatever order suits it, so the ranking is
        reapplied here — losing it after fusing would discard the entire point
        of fusing.
        """
        if not chunk_ids:
            return []

        rows = (
            await self._session.execute(
                text(
                    """
                    SELECT c.id, c.document_id, d.title, c.heading_path, c.content,
                           c.context_header, c.ordinal
                    FROM rag.chunk c
                    JOIN rag.document d ON d.id = c.document_id
                    WHERE c.id = ANY(CAST(:ids AS uuid[]))
                    """
                ),
                {"ids": chunk_ids},
            )
        ).all()

        by_id = {
            row.id: RetrievedChunk(
                chunk_id=row.id,
                document_id=row.document_id,
                document_title=row.title,
                heading_path=list(row.heading_path or []),
                content=row.content,
                context_header=row.context_header,
                ordinal=row.ordinal,
            )
            for row in rows
        }

        return [by_id[chunk_id] for chunk_id in chunk_ids if chunk_id in by_id]
