"""A deterministic synthesiser, for tests and local development.

It does not understand anything. It quotes the first chunk it was given and
cites it correctly, which is enough to exercise every stage above it —
assembly, validation, persistence, streaming and rendering — without a key, a
network or a bill.

Two behaviours are deliberate rather than incidental:

- Given no chunks it produces the refusal envelope, so the "I don't have that"
  path is the one that runs by default in CI rather than the one nobody tests.
- Its citations are real chunk ids, so the provenance validator sees valid
  input. Tests that need a *failing* validator construct that case directly
  rather than relying on a fake being bad at its job.
"""

from __future__ import annotations

from soyl.domain.ai.envelope import DraftAnswer, DraftBlock
from soyl.domain.ai.ports import Usage
from soyl.domain.rag.retrieval import RetrievedChunk

PROVIDER = "fake"

# Enough to be recognisable in a rendered block without dominating it.
QUOTE_CHARS = 240


class FakeAnswers:
    """Implements `AnswerProvider` with no I/O."""

    def __init__(self, *, model: str = "fake-answers-v1") -> None:
        self._model = model

    @property
    def model(self) -> str:
        return self._model

    async def synthesise(
        self, *, question: str, chunks: list[RetrievedChunk]
    ) -> tuple[DraftAnswer, Usage]:
        if not chunks:
            return (
                DraftAnswer(
                    headline="The documents do not cover that.",
                    blocks=[
                        DraftBlock(
                            type="alert.callout",
                            level="info",
                            markdown=(
                                "Nothing in the uploaded documents answers this. "
                                "Try rephrasing, or upload the policy that covers it."
                            ),
                        )
                    ],
                ),
                Usage(provider=PROVIDER, model=self._model),
            )

        first = chunks[0]
        section = " > ".join(first.heading_path) if first.heading_path else first.document_title

        return (
            DraftAnswer(
                headline=f"{section} covers this.",
                blocks=[
                    DraftBlock(
                        type="text.markdown",
                        title=None,
                        markdown=f"Based on {first.document_title}, under {section}.",
                        provenance=[str(first.chunk_id)],
                    ),
                    DraftBlock(
                        type="doc.citation",
                        quote=first.content[:QUOTE_CHARS],
                        provenance=[str(first.chunk_id)],
                    ),
                ],
                followups=[f"What else does {first.document_title} say?"],
            ),
            Usage(
                provider=PROVIDER,
                model=self._model,
                input_tokens=sum(len(c.content) for c in chunks) // 4,
                output_tokens=40,
            ),
        )
