"""Reciprocal Rank Fusion.

The properties here are the ones the M4 acceptance numbers depend on, so they
are asserted rather than assumed — recall@10 and precision@5 are measured on
exact positions, and a fusion that reorders non-deterministically would make
those numbers unrepeatable.
"""

from __future__ import annotations

import uuid

from soyl.domain.rag.fusion import RRF_K, Retrieved, reciprocal_rank_fusion

A, B, C, D = (uuid.UUID(int=index) for index in range(1, 5))


def ranked(*chunk_ids: uuid.UUID) -> list[Retrieved]:
    """A retriever's output, best first, with descending dummy scores."""
    return [
        Retrieved(chunk_id=chunk_id, score=1.0 - index * 0.1)
        for index, chunk_id in enumerate(chunk_ids)
    ]


def test_a_single_retriever_keeps_its_order() -> None:
    fused = reciprocal_rank_fusion({"vector": ranked(A, B, C)})

    assert [entry.chunk_id for entry in fused] == [A, B, C]


def test_agreement_across_retrievers_wins() -> None:
    """The whole point of fusing.

    B is second in both lists; A and C are first in one and absent from the
    other. Two second places beat one first place, because two retrievers
    agreeing is stronger evidence than one being enthusiastic.
    """
    fused = reciprocal_rank_fusion({"vector": ranked(A, B), "lexical": ranked(C, B)})

    assert fused[0].chunk_id == B
    assert fused[0].retriever_count == 2


def test_scores_are_ignored_entirely() -> None:
    """RRF reads ranks, never scores.

    Cosine similarity and ts_rank are not commensurable and their
    distributions shift per query — which is exactly why any weighting tuned
    for one question is wrong for the next.
    """
    confident = [Retrieved(chunk_id=A, score=0.99), Retrieved(chunk_id=B, score=0.98)]
    timid = [Retrieved(chunk_id=A, score=0.01), Retrieved(chunk_id=B, score=0.005)]

    assert [entry.chunk_id for entry in reciprocal_rank_fusion({"r": confident})] == [
        entry.chunk_id for entry in reciprocal_rank_fusion({"r": timid})
    ]


def test_the_formula_is_the_published_one() -> None:
    # Worth pinning: a subtly different k or an off-by-one in the rank changes
    # every ranking in the eval set at once.
    (only,) = reciprocal_rank_fusion({"vector": ranked(A)})

    assert only.score == 1.0 / (RRF_K + 1)


def test_ranks_are_recorded_so_a_result_can_be_explained() -> None:
    """"Vector had it third, lexical did not have it" is a debuggable statement.

    The M6 answer inspector renders this, and without it a ranking is a number
    nobody can argue with.
    """
    fused = reciprocal_rank_fusion({"vector": ranked(A, B, C), "questions": ranked(C, A)})

    by_id = {entry.chunk_id: entry for entry in fused}
    assert by_id[C].ranks == {"vector": 3, "questions": 1}
    assert "lexical" not in by_id[A].ranks


def test_a_chunk_found_by_every_retriever_outranks_one_found_by_two() -> None:
    fused = reciprocal_rank_fusion(
        {
            "vector": ranked(A, B),
            "lexical": ranked(A, C),
            "questions": ranked(A, D),
        }
    )

    assert fused[0].chunk_id == A
    assert fused[0].retriever_count == 3


def test_ordering_is_deterministic_for_identical_input() -> None:
    """Recall@10 and precision@5 are measured on exact positions.

    A fusion that reordered ties differently between runs would make those
    numbers unrepeatable, and an unrepeatable metric cannot be improved
    against.
    """
    results = {"vector": ranked(A, B), "lexical": ranked(C, D)}

    first = [entry.chunk_id for entry in reciprocal_rank_fusion(results)]
    for _ in range(20):
        assert [entry.chunk_id for entry in reciprocal_rank_fusion(results)] == first


def test_a_retriever_returning_nothing_does_not_break_fusion() -> None:
    # Lexical search legitimately finds nothing for a purely conceptual query.
    fused = reciprocal_rank_fusion({"vector": ranked(A, B), "lexical": []})

    assert [entry.chunk_id for entry in fused] == [A, B]


def test_no_results_at_all_fuses_to_nothing() -> None:
    # §8: the system must be allowed to return zero results and say so.
    assert reciprocal_rank_fusion({"vector": [], "lexical": []}) == []


def test_the_limit_truncates_after_fusing_not_before() -> None:
    """Truncating first would discard the agreement that fusion exists to find.

    C is last in the vector list and first in lexical; cutting the vector list
    to two before fusing would lose that.
    """
    fused = reciprocal_rank_fusion(
        {"vector": ranked(A, B, C), "lexical": ranked(C, D)}, limit=2
    )

    assert len(fused) == 2
    assert fused[0].chunk_id == C


def test_a_retriever_gets_one_vote_per_chunk() -> None:
    """A duplicate must not double a chunk's weight.

    The first version of this test only checked the rank and let the bug
    through: the score was still being added twice. A query whose SQL
    accidentally joined a row into existence twice would then reorder the
    results silently rather than fail.
    """
    duplicated = [*ranked(A, B), Retrieved(chunk_id=A, score=0.1)]

    fused = reciprocal_rank_fusion({"vector": duplicated})
    clean = reciprocal_rank_fusion({"vector": ranked(A, B)})

    by_id = {entry.chunk_id: entry for entry in fused}
    assert by_id[A].ranks["vector"] == 1
    # The score, not just the rank — which is what the first version missed.
    assert by_id[A].score == clean[0].score
    assert [entry.chunk_id for entry in fused] == [entry.chunk_id for entry in clean]
