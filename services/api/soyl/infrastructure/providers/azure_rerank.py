"""Listwise reranking on Azure OpenAI.

§45.3 specifies a cross-encoder — Cohere Rerank or an Azure-hosted one — and
names an LLM listwise rerank as the fallback "if reranking is unavailable".
It is unavailable: our Azure AI Foundry resource has an embedding deployment
and a chat deployment, and no cross-encoder. So this is the fallback, built
against the same port, and it should be replaced the day a cross-encoder exists.

**The latency budget cannot be the handbook's.** §45.3 says 400ms p95, which is
a cross-encoder number — a single forward pass over 30 short pairs. An LLM
scoring 30 candidates takes seconds, not milliseconds. Holding this
implementation to 400ms would mean it timed out on every request and the
reranker would be dead code that looked alive. The budget is therefore stated
here, in the module that owns the constraint, and reverts to 400ms with the
cross-encoder.

The model returns *scores*, not an ordering. Asking for a permutation invites
two failures this avoids: dropped candidates, and repeated ones. Scores are
independent per candidate, so a malformed one costs that candidate and not the
list — and the sort is ours, which means it is deterministic.
"""

from __future__ import annotations

import json
import logging
from decimal import Decimal

from openai import (
    APIConnectionError,
    APIStatusError,
    APITimeoutError,
    AsyncAzureOpenAI,
    RateLimitError,
)
from openai.types.chat import (
    ChatCompletionMessageParam,
    ChatCompletionSystemMessageParam,
    ChatCompletionUserMessageParam,
)
from openai.types.shared_params import ResponseFormatJSONSchema

from soyl.domain.ai.ports import ProviderError, Ranked, RerankResult, Usage

logger = logging.getLogger("soyl.providers.rerank")

PROVIDER = "azure_openai"

# An LLM listwise rerank, not a cross-encoder. See the module docstring.
DEFAULT_TIMEOUT_SECONDS = 20.0

SYSTEM = (
    "You score how well each passage answers a hotel employee's question.\n\n"
    "Score each passage from 0 to 10:\n"
    "- 10: directly and completely answers the question.\n"
    "- 7-9: contains the answer, possibly among other material.\n"
    "- 4-6: related to the topic but does not answer the question.\n"
    "- 1-3: same document or department, different subject.\n"
    "- 0: unrelated.\n\n"
    "Rules:\n"
    "- Score every passage you are given, using its exact index.\n"
    "- Judge only whether the passage answers *this* question. A well-written "
    "passage about something else scores low.\n"
    "- Being on the same topic is not answering. 'Cancellation is covered in "
    "the rate plan' does not answer what the cancellation window is.\n"
    "- Do not explain. Return scores only."
)

RESPONSE_FORMAT: ResponseFormatJSONSchema = {
    "type": "json_schema",
    "json_schema": {
        "name": "passage_scores",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "scores": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "index": {"type": "integer"},
                            "score": {"type": "number"},
                        },
                        "required": ["index", "score"],
                        "additionalProperties": False,
                    },
                }
            },
            "required": ["scores"],
            "additionalProperties": False,
        },
    },
}

# Enough to judge relevance, short enough that 30 of them fit comfortably. A
# passage whose relevance is not apparent in 1200 characters is not the passage
# that answers the question.
CANDIDATE_CHARS = 1200

MAX_SCORE = 10.0


class AzureOpenAIRerank:
    """Implements `RerankProvider`."""

    def __init__(
        self,
        *,
        endpoint: str,
        api_key: str,
        deployment: str,
        model: str,
        api_version: str = "2024-10-21",
        usd_per_million_input: Decimal = Decimal("0.25"),
        usd_per_million_output: Decimal = Decimal("2.00"),
        timeout_seconds: float = DEFAULT_TIMEOUT_SECONDS,
    ) -> None:
        self._deployment = deployment
        self._model = model
        self._in_price = usd_per_million_input
        self._out_price = usd_per_million_output
        self._client = AsyncAzureOpenAI(
            azure_endpoint=endpoint,
            api_key=api_key,
            api_version=api_version,
            timeout=timeout_seconds,
            # Reranking sits on the request path behind a latency budget. A
            # retry here would blow the budget and the caller would fall back
            # to fusion order anyway, having waited twice as long to do it.
            max_retries=0,
        )

    @property
    def model(self) -> str:
        return self._model

    async def rerank(self, *, query: str, documents: list[str], top_n: int) -> RerankResult:
        if not documents:
            return RerankResult(
                results=[], usage=Usage(provider=PROVIDER, model=self._model)
            )

        listing = "\n\n".join(
            f"[{index}] {text[:CANDIDATE_CHARS]}" for index, text in enumerate(documents)
        )
        prompt = f"Question: {query}\n\nPassages:\n\n{listing}"

        messages: list[ChatCompletionMessageParam] = [
            ChatCompletionSystemMessageParam(role="system", content=SYSTEM),
            ChatCompletionUserMessageParam(role="user", content=prompt),
        ]

        try:
            response = await self._client.chat.completions.create(
                model=self._deployment,
                messages=messages,
                response_format=RESPONSE_FORMAT,
                # One object per candidate is small; this is sized for 30 of
                # them with room to spare.
                max_completion_tokens=1200,
            )
        except (APITimeoutError, APIConnectionError, RateLimitError) as exc:
            raise ProviderError(
                f"rerank provider unavailable: {type(exc).__name__}", retryable=True
            ) from exc
        except APIStatusError as exc:
            raise ProviderError(
                f"rerank provider returned {exc.status_code}",
                retryable=exc.status_code >= 500,
            ) from exc

        body = response.choices[0].message.content or "{}"
        try:
            parsed = json.loads(body)
        except json.JSONDecodeError as exc:
            raise ProviderError(
                "rerank provider returned unparseable JSON", retryable=True
            ) from exc

        usage = response.usage

        return RerankResult(
            results=_ranked(parsed.get("scores", []), candidate_count=len(documents), top_n=top_n),
            usage=Usage(
                provider=PROVIDER,
                model=self._model,
                input_tokens=usage.prompt_tokens if usage else 0,
                output_tokens=usage.completion_tokens if usage else 0,
            ),
        )


def _ranked(raw: list[dict[str, object]], *, candidate_count: int, top_n: int) -> list[Ranked]:
    """Turn the model's scores into a ranking we are willing to cite from.

    Everything here is defence against a plausible-looking bad response, and
    each guard exists because the consequence is a citation pointing at the
    wrong document rather than an error anyone would notice:

    - An index outside the candidate list is dropped. Left in, it would either
      raise on lookup or, with a negative index, silently cite the passage at
      the other end of the list.
    - A repeated index keeps its first score, so one candidate cannot occupy
      two slots in a top 8.
    - Scores are clamped before normalising, so an out-of-range 50 cannot
      outrank everything and drag a weak passage past the threshold.
    - A candidate the model omitted scores 0 rather than being dropped. Silence
      is not evidence of relevance, but it is also not evidence of absence, and
      dropping it would let a truncated response quietly shrink the corpus.
    """
    scores: dict[int, float] = {}

    for item in raw:
        index = item.get("index")
        score = item.get("score")
        if not isinstance(index, int) or isinstance(index, bool):
            continue
        if not isinstance(score, (int, float)) or isinstance(score, bool):
            continue
        if not 0 <= index < candidate_count or index in scores:
            continue
        scores[index] = min(max(float(score), 0.0), MAX_SCORE) / MAX_SCORE

    missing = candidate_count - len(scores)
    if missing:
        logger.info("reranker scored %d of %d candidates", len(scores), candidate_count)

    ranked = [Ranked(index=index, score=scores.get(index, 0.0)) for index in range(candidate_count)]
    # Ties break on the original index, which is fusion order — so where the
    # reranker has no opinion, retrieval's opinion stands.
    ranked.sort(key=lambda item: (-item.score, item.index))
    return ranked[:top_n]
