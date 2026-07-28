"""The reranker's response parsing.

Almost everything here is about a *plausible* bad response rather than an
obviously broken one. A reranker that raises is harmless — retrieval catches it
and falls back to fusion order. A reranker that returns a well-formed ranking
built from a bad index is not: it produces an answer with a citation pointing
at a different document, which is indistinguishable from a correct answer until
someone opens the source.

So these tests exist for the quiet failures.
"""

from __future__ import annotations

from soyl.infrastructure.providers.azure_rerank import MAX_SCORE, _ranked


def test_scores_are_normalised_to_zero_one() -> None:
    """§45.3 states the threshold as a normalised 0.25.

    A raw 0-10 score would make that number mean something different for every
    implementation, so normalisation is part of the port's contract rather than
    a formatting choice.
    """
    ranked = _ranked([{"index": 0, "score": MAX_SCORE}], candidate_count=1, top_n=5)

    assert ranked[0].score == 1.0


def test_results_are_ordered_best_first() -> None:
    ranked = _ranked(
        [{"index": 0, "score": 2.0}, {"index": 1, "score": 9.0}, {"index": 2, "score": 5.0}],
        candidate_count=3,
        top_n=5,
    )

    assert [item.index for item in ranked] == [1, 2, 0]


def test_an_out_of_range_index_is_dropped() -> None:
    """The one that would cite the wrong document.

    A negative index does not raise on a Python list — it silently selects from
    the other end. The caller would get a confident answer citing a passage the
    reranker never scored.
    """
    ranked = _ranked(
        [{"index": -1, "score": 9.0}, {"index": 99, "score": 9.0}, {"index": 0, "score": 8.0}],
        candidate_count=2,
        top_n=5,
    )

    assert all(0 <= item.index < 2 for item in ranked)
    assert ranked[0].index == 0


def test_a_repeated_index_keeps_its_first_score() -> None:
    """One candidate must not occupy two slots in a top 8.

    It would both waste a slot and, in the envelope, produce two citations to
    the same passage — which reads as corroboration when it is one source.
    """
    ranked = _ranked(
        [{"index": 0, "score": 9.0}, {"index": 0, "score": 1.0}], candidate_count=2, top_n=5
    )

    assert [item.index for item in ranked] == [0, 1]
    assert ranked[0].score == 0.9


def test_scores_are_clamped_into_range() -> None:
    """An out-of-range score must not drag a weak passage past the threshold."""
    ranked = _ranked(
        [{"index": 0, "score": 50.0}, {"index": 1, "score": -5.0}], candidate_count=2, top_n=5
    )

    assert ranked[0].score == 1.0
    assert ranked[1].score == 0.0


def test_an_unscored_candidate_scores_zero_rather_than_vanishing() -> None:
    """Silence is not evidence of relevance, but it is not absence either.

    Dropping unscored candidates would let a truncated response quietly shrink
    the corpus for that question — the model stops writing at token 1200 and
    the last ten passages cease to exist.
    """
    ranked = _ranked([{"index": 1, "score": 8.0}], candidate_count=3, top_n=5)

    assert {item.index for item in ranked} == {0, 1, 2}
    assert ranked[0].index == 1
    assert [item.score for item in ranked[1:]] == [0.0, 0.0]


def test_ties_break_on_fusion_order() -> None:
    """Where the reranker has no opinion, retrieval's opinion stands.

    Candidates arrive in fused order, so the original index *is* the fusion
    ranking — falling back to it is free and makes the output deterministic,
    which recall@10 and precision@5 both depend on.
    """
    ranked = _ranked([], candidate_count=4, top_n=4)

    assert [item.index for item in ranked] == [0, 1, 2, 3]


def test_top_n_truncates() -> None:
    ranked = _ranked(
        [{"index": index, "score": float(index)} for index in range(10)],
        candidate_count=10,
        top_n=3,
    )

    assert len(ranked) == 3
    assert [item.index for item in ranked] == [9, 8, 7]


def test_malformed_entries_are_ignored_without_taking_the_list_down() -> None:
    """One bad object costs one candidate, not the query.

    This is why the prompt asks for scores rather than a permutation: scores
    are independent, so a garbled entry is recoverable.
    """
    ranked = _ranked(
        [
            {"index": "0", "score": 9.0},
            {"index": 0, "score": "high"},
            {"score": 5.0},
            {"index": 1},
            {"index": 1, "score": 7.0},
        ],
        candidate_count=2,
        top_n=5,
    )

    assert ranked[0].index == 1
    assert ranked[0].score == 0.7
    assert ranked[1].score == 0.0


def test_booleans_are_not_accepted_as_indices_or_scores() -> None:
    """`True` is an `int` and `isinstance(True, int)` is `True`.

    Without the explicit guard, `{"index": True}` would score candidate 1 and
    `{"score": True}` would be a 0.1 — both wrong, neither visible.
    """
    ranked = _ranked(
        [{"index": True, "score": 9.0}, {"index": 1, "score": True}], candidate_count=2, top_n=5
    )

    assert all(item.score == 0.0 for item in ranked)
