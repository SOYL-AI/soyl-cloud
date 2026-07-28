"""What the application may ask of a model provider.

`UPDATE.md` §6.9: no file outside `soyl/infrastructure/providers/` may import a
provider SDK. This module is the reason that rule costs nothing — everything
above it talks to these types, so there is never an occasion to reach for
`openai` somewhere it does not belong. An `import-linter` contract enforces it
rather than trusting anyone to remember.

Pure domain: no SDK, no HTTP, no settings.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Protocol


class ProviderError(Exception):
    """The provider failed. `retryable` decides whether the worker tries again."""

    def __init__(self, message: str, *, retryable: bool = False) -> None:
        self.retryable = retryable
        super().__init__(message)


@dataclass(frozen=True, slots=True)
class Usage:
    """What one model call consumed.

    Carried back from every call so it can reach `billing.usage_ledger`.
    `UPDATE.md` §6.6 requires this from the first model call, which is why it
    is part of the return type rather than something the caller is trusted to
    remember to record.
    """

    provider: str
    model: str
    input_tokens: int = 0
    output_tokens: int = 0
    cached_tokens: int = 0
    # For anything priced per unit rather than per token.
    units: Decimal = Decimal(0)


@dataclass(frozen=True, slots=True)
class EmbeddingResult:
    """Vectors in the order the inputs were given, plus what they cost."""

    vectors: list[list[float]]
    usage: Usage

    def __post_init__(self) -> None:
        # A provider that silently returns fewer vectors than inputs would
        # misalign every chunk from its embedding, and the corpus would look
        # fine while retrieving nonsense.
        if any(not vector for vector in self.vectors):
            raise ProviderError("provider returned an empty embedding")


@dataclass(frozen=True, slots=True)
class QuestionResult:
    """Hypothetical questions for one chunk, plus what they cost."""

    questions: list[str]
    usage: Usage


class QuestionProvider(Protocol):
    """Generates the questions a chunk is the answer to (§43.2).

    Separate from `EmbeddingProvider` because they are different models with
    different prices and different failure modes — and because question
    generation is allowed to fail without failing the ingestion, while
    embedding is not. A document with no hypothetical questions is a slightly
    worse retrieval target; a document with no vectors is not in the corpus.
    """

    @property
    def model(self) -> str:
        ...

    async def generate(self, *, context_header: str, content: str, count: int) -> QuestionResult:
        """Questions a user might ask that this passage answers."""
        ...


class EmbeddingProvider(Protocol):
    """Turns text into vectors."""

    @property
    def model(self) -> str:
        """The model identifier stored alongside each vector.

        Recorded per row so a model change can be rolled forward document by
        document rather than as one outage.
        """
        ...

    @property
    def dimensions(self) -> int:
        """Must match the `vector(n)` column, or writes fail at the database."""
        ...

    async def embed(self, texts: list[str]) -> EmbeddingResult:
        """Embed a batch, preserving order.

        Batching is the caller's decision because the right size depends on
        the provider's limits, and a port that hides it would make those limits
        unreachable.
        """
        ...
