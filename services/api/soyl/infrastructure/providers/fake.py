"""A deterministic embedding provider, for tests and local development.

Imports nothing. That is the point: the whole ingestion pipeline can be built,
tested and demonstrated without an API key, a network, or a bill — and the day
Azure credentials arrive, the only thing that changes is which object gets
constructed in `main.py`.

**These vectors are not semantic.** They are a hash smeared across the
dimensions, so identical text embeds identically and different text embeds
differently, which is all a pipeline test needs. Retrieval *quality* cannot be
measured with them, and M4's recall and precision numbers must come from the
real provider — anything else would be measuring this function.
"""

from __future__ import annotations

import hashlib
import math
from decimal import Decimal

from soyl.domain.ai.ports import EmbeddingResult, Usage

PROVIDER = "fake"


class FakeEmbeddings:
    """Implements `EmbeddingProvider` with no I/O."""

    def __init__(self, *, dimensions: int = 1536, model: str = "fake-embedding-v1") -> None:
        self._dimensions = dimensions
        self._model = model

    @property
    def model(self) -> str:
        return self._model

    @property
    def dimensions(self) -> int:
        return self._dimensions

    def cost_inr(self, input_tokens: int) -> Decimal:
        return Decimal(0)

    async def embed(self, texts: list[str]) -> EmbeddingResult:
        vectors = [self._vector(text) for text in texts]

        return EmbeddingResult(
            vectors=vectors,
            usage=Usage(
                provider=PROVIDER,
                model=self._model,
                # Roughly four characters per token — close enough that the
                # ledger has plausible numbers in it during development.
                input_tokens=sum(len(text) for text in texts) // 4,
                units=Decimal(len(texts)),
            ),
        )

    def _vector(self, text: str) -> list[float]:
        """A stable unit vector derived from the text.

        Normalised because the index uses cosine distance, and unnormalised
        vectors would make magnitude — here an artefact of the hash — affect
        ranking.
        """
        digest = hashlib.sha256(text.encode("utf-8")).digest()
        raw = [
            # Expand 32 bytes to however many dimensions are needed by rehashing
            # with the position mixed in.
            int.from_bytes(
                hashlib.sha256(digest + index.to_bytes(4, "big")).digest()[:8], "big"
            )
            / float(1 << 64)
            - 0.5
            for index in range(self._dimensions)
        ]

        magnitude = math.sqrt(sum(value * value for value in raw)) or 1.0
        return [value / magnitude for value in raw]
