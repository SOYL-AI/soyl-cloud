"""Reciprocal Rank Fusion.

Handbook §45.1. Three retrievers return three ranked lists of the same chunks
in different orders, and something has to combine them.

**Why not weighted score fusion.** Cosine similarity and a `ts_rank` score are
not commensurable — they are on different scales with different distributions,
and those distributions shift per query. Any weighting that works for one
question is wrong for the next, and tuning it is a permanent job.

RRF throws the scores away and uses only ranks:

    RRF(d) = Σ over retrievers r of  1 / (k + rank_r(d))

with `k = 60`. It is parameter-light, robust, and consistently competitive with
tuned weighted fusion — with none of the tuning.

Pure domain: lists in, list out, no database. That is deliberate, because this
is the part of retrieval most likely to be adjusted against the labelled set in
M4, and adjusting it should not require a corpus.
"""

from __future__ import annotations

import uuid
from collections.abc import Sequence
from dataclasses import dataclass, field

# The constant from the original RRF paper, and the value the handbook fixes.
# Large k flattens the contribution of rank differences; small k makes the top
# of each list dominate. 60 is the well-tested middle and is not worth tuning
# before there is a labelled set to tune against.
RRF_K = 60


@dataclass(frozen=True, slots=True)
class Retrieved:
    """One chunk as one retriever saw it."""

    chunk_id: uuid.UUID
    # The retriever's own score, carried for debugging and the M6 answer
    # inspector. RRF does not read it.
    score: float


@dataclass(slots=True)
class Fused:
    """One chunk after fusion, with the evidence for its position."""

    chunk_id: uuid.UUID
    score: float = 0.0
    # Which retrievers found it, and where. This is what makes a ranking
    # explainable — "the vector search had it third, lexical did not have it at
    # all" is a debuggable statement.
    ranks: dict[str, int] = field(default_factory=dict)

    @property
    def retriever_count(self) -> int:
        return len(self.ranks)


def reciprocal_rank_fusion(
    results: dict[str, Sequence[Retrieved]],
    *,
    k: int = RRF_K,
    limit: int | None = None,
) -> list[Fused]:
    """Fuse ranked lists into one.

    `results` maps a retriever name to its ranked results, best first. Names
    are preserved in `Fused.ranks` so a result can be traced back to what
    found it.

    Ties break on how many retrievers agreed, then on chunk id. The first is
    meaningful — a chunk three retrievers found is better evidence than one
    only vector search liked — and the second exists only so the order is
    deterministic, which matters because the eval set is scored on exact
    positions.
    """
    fused: dict[uuid.UUID, Fused] = {}

    for retriever, ranked in results.items():
        for position, item in enumerate(ranked, start=1):
            entry = fused.setdefault(item.chunk_id, Fused(chunk_id=item.chunk_id))

            # A retriever gets one vote per chunk. Without this guard a list
            # containing the same chunk twice contributes twice, which quietly
            # doubles its weight — and a `SELECT` that accidentally joins a
            # row into existence twice would silently reorder the results
            # rather than fail.
            if retriever in entry.ranks:
                entry.ranks[retriever] = min(entry.ranks[retriever], position)
                continue

            entry.score += 1.0 / (k + position)
            entry.ranks[retriever] = position

    ordered = sorted(
        fused.values(),
        key=lambda entry: (-entry.score, -entry.retriever_count, str(entry.chunk_id)),
    )

    return ordered[:limit] if limit is not None else ordered
