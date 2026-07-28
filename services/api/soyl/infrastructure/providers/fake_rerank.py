"""A deterministic reranker, for tests and local development.

Scores by word overlap between the query and the passage. That is a real signal
— it will genuinely push an exactly-matching passage up — but it is lexical,
which means it cannot do the one thing a reranker exists to do: tell "cancel
free" from "cancellation without penalty".

So this is here to prove the *plumbing*: that the pipeline calls the reranker,
respects its ordering, applies the threshold, and survives it returning fewer
results than asked for. It is not evidence of reranking quality, and the
factory logs as much when it selects it.
"""

from __future__ import annotations

import re

from soyl.domain.ai.ports import Ranked, RerankResult, Usage

PROVIDER = "fake"

_WORD = re.compile(r"[a-z0-9]+")

# Words that appear in almost every hotel document, so overlapping on them says
# nothing. Without this the fake ranks by passage length rather than relevance.
_STOP = frozenset(
    "a an and are as at be by can do does for from has have how i if in is it "
    "must not of on or our shall should that the their they this to we what "
    "when where which who will with you your".split()
)


def _terms(text: str) -> set[str]:
    return {word for word in _WORD.findall(text.lower()) if word not in _STOP}


class FakeRerank:
    """Implements `RerankProvider` with no I/O."""

    def __init__(self, *, model: str = "fake-rerank-v1") -> None:
        self._model = model

    @property
    def model(self) -> str:
        return self._model

    async def rerank(self, *, query: str, documents: list[str], top_n: int) -> RerankResult:
        wanted = _terms(query)

        ranked = []
        for index, text in enumerate(documents):
            # Proportion of the query covered, not raw overlap count, so a long
            # passage cannot win by accumulating incidental matches.
            overlap = len(wanted & _terms(text)) / len(wanted) if wanted else 0.0
            ranked.append(Ranked(index=index, score=overlap))

        # Ties break on the original index, so where the fake has no opinion
        # fusion order stands — the same rule the real provider follows.
        ranked.sort(key=lambda item: (-item.score, item.index))

        return RerankResult(
            results=ranked[:top_n],
            usage=Usage(provider=PROVIDER, model=self._model),
        )
