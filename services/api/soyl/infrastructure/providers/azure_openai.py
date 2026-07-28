"""Azure OpenAI (AI Foundry) embeddings.

**One of exactly two files permitted to import a provider SDK** — the other is
`fake.py` beside it, which imports nothing. `import-linter` forbids `openai`
from `soyl.domain`, `soyl.application`, `soyl.interface`,
`soyl.infrastructure.db` and `soyl.infrastructure.storage`, so §6.9 is checked
in CI rather than remembered in review.

Azure rather than OpenAI direct, per the founder's decision. The differences
that matter here:

- The URL is built from a **deployment name**, not a model name. The deployment
  is what you named it in Foundry; the model is what is behind it. Both are
  recorded — the deployment to call, the model to store next to each vector.
- Auth is an `api-key` header, not a bearer token.
- An `api_version` is required and pins the request shape.
- Azure does not train on your data, and abuse-monitoring retention can be
  switched off on approval — which is what `DECISIONS.md` §6's zero-retention
  requirement is asking for. Getting that switched off is an account task, not
  a code one.
"""

from __future__ import annotations

import logging
from decimal import Decimal

from openai import (
    APIConnectionError,
    APIStatusError,
    APITimeoutError,
    AsyncAzureOpenAI,
    RateLimitError,
)

from soyl.domain.ai.ports import EmbeddingResult, ProviderError, Usage

logger = logging.getLogger("soyl.providers.azure")

PROVIDER = "azure_openai"


class AzureOpenAIEmbeddings:
    """Implements `EmbeddingProvider`."""

    def __init__(
        self,
        *,
        endpoint: str,
        api_key: str,
        deployment: str,
        model: str,
        dimensions: int,
        api_version: str = "2024-10-21",
        # USD per million input tokens, converted at write time. Kept here
        # because it is provider knowledge; the ledger stores the result.
        usd_per_million_tokens: Decimal = Decimal("0.02"),
        usd_to_inr: Decimal = Decimal("88"),
        timeout_seconds: float = 60.0,
    ) -> None:
        self._deployment = deployment
        self._model = model
        self._dimensions = dimensions
        self._usd_per_million = usd_per_million_tokens
        self._usd_to_inr = usd_to_inr

        self._client = AsyncAzureOpenAI(
            azure_endpoint=endpoint,
            api_key=api_key,
            api_version=api_version,
            timeout=timeout_seconds,
            # The SDK retries transient failures itself. Two, not more: the
            # worker retries the whole job as well, and stacking retries turns
            # a provider outage into an unbounded wait.
            max_retries=2,
        )

    @property
    def model(self) -> str:
        return self._model

    @property
    def dimensions(self) -> int:
        return self._dimensions

    def cost_inr(self, input_tokens: int) -> Decimal:
        return (
            Decimal(input_tokens) / Decimal(1_000_000) * self._usd_per_million * self._usd_to_inr
        )

    async def embed(self, texts: list[str]) -> EmbeddingResult:
        if not texts:
            return EmbeddingResult(vectors=[], usage=Usage(provider=PROVIDER, model=self._model))

        try:
            response = await self._client.embeddings.create(
                model=self._deployment,
                input=texts,
                dimensions=self._dimensions,
            )
        except (APITimeoutError, APIConnectionError, RateLimitError) as exc:
            # Worth trying again: a timeout, a dropped connection, a 429.
            raise ProviderError(f"embedding provider unavailable: {type(exc).__name__}",
                                retryable=True) from exc
        except APIStatusError as exc:
            # 4xx other than rate limiting is our fault — a bad deployment
            # name, a revoked key, an input over the token limit. Retrying
            # spends money to fail identically.
            retryable = exc.status_code >= 500
            raise ProviderError(
                f"embedding provider returned {exc.status_code}", retryable=retryable
            ) from exc

        # Azure returns items with an index; relying on arrival order would
        # silently pair chunks with the wrong vectors.
        ordered = sorted(response.data, key=lambda item: item.index)
        vectors = [list(item.embedding) for item in ordered]

        if len(vectors) != len(texts):
            raise ProviderError(
                f"asked for {len(texts)} embeddings and got {len(vectors)}"
            )

        return EmbeddingResult(
            vectors=vectors,
            usage=Usage(
                provider=PROVIDER,
                model=self._model,
                input_tokens=response.usage.prompt_tokens if response.usage else 0,
                units=Decimal(len(texts)),
            ),
        )
