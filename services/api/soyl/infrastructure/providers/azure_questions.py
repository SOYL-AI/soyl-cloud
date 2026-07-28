"""Hypothetical question generation on Azure OpenAI.

§43.2: users ask "can I cancel free?"; the document says "cancellation without
penalty". Two to four questions per chunk, embedded alongside the content,
generated once at ingest rather than by expanding every query at retrieval
time — which the handbook notes is both cheaper and better.

Uses strict `json_schema` structured output rather than asking for JSON in the
prompt and hoping. The model cannot return a shape that fails validation, so
there is no parsing branch to get wrong and no retry loop for malformed output.
The same mechanism carries the Response Envelope in M4, so it is worth being
sure of here.
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

from soyl.domain.ai.ports import ProviderError, QuestionResult, Usage

logger = logging.getLogger("soyl.providers.questions")

PROVIDER = "azure_openai"

SYSTEM = (
    "You write the questions a hotel employee would type to find a given passage "
    "from their own internal documents.\n\n"
    "Rules:\n"
    "- Write questions the passage genuinely answers. Never invent facts.\n"
    "- Use the words a person would use, not the document's wording. Where a "
    "document says 'cancellation without penalty', a question might be "
    "'can we cancel for free?'.\n"
    "- Vary the phrasing rather than restating one question.\n"
    "- Keep each under 20 words. No numbering, no preamble."
)

RESPONSE_FORMAT: ResponseFormatJSONSchema = {
    "type": "json_schema",
    "json_schema": {
        "name": "hypothetical_questions",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {"questions": {"type": "array", "items": {"type": "string"}}},
            "required": ["questions"],
            "additionalProperties": False,
        },
    },
}


class AzureOpenAIQuestions:
    """Implements `QuestionProvider`."""

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
        usd_to_inr: Decimal = Decimal("88"),
        timeout_seconds: float = 45.0,
    ) -> None:
        self._deployment = deployment
        self._model = model
        self._in_price = usd_per_million_input
        self._out_price = usd_per_million_output
        self._usd_to_inr = usd_to_inr
        self._client = AsyncAzureOpenAI(
            azure_endpoint=endpoint,
            api_key=api_key,
            api_version=api_version,
            timeout=timeout_seconds,
            max_retries=2,
        )

    @property
    def model(self) -> str:
        return self._model

    def cost_inr(self, input_tokens: int, output_tokens: int = 0) -> Decimal:
        million = Decimal(1_000_000)
        return (
            Decimal(input_tokens) / million * self._in_price
            + Decimal(output_tokens) / million * self._out_price
        ) * self._usd_to_inr

    async def generate(self, *, context_header: str, content: str, count: int) -> QuestionResult:
        prompt = (
            f"{context_header}\n{content}\n\nWrite {count} questions this passage answers."
        )

        messages: list[ChatCompletionMessageParam] = [
            ChatCompletionSystemMessageParam(role="system", content=SYSTEM),
            ChatCompletionUserMessageParam(role="user", content=prompt),
        ]

        try:
            response = await self._client.chat.completions.create(
                model=self._deployment,
                messages=messages,
                response_format=RESPONSE_FORMAT,
                max_completion_tokens=400,
            )
        except (APITimeoutError, APIConnectionError, RateLimitError) as exc:
            raise ProviderError(
                f"question provider unavailable: {type(exc).__name__}", retryable=True
            ) from exc
        except APIStatusError as exc:
            raise ProviderError(
                f"question provider returned {exc.status_code}",
                retryable=exc.status_code >= 500,
            ) from exc

        body = response.choices[0].message.content or "{}"
        try:
            parsed = json.loads(body)
        except json.JSONDecodeError as exc:
            # Unreachable with strict schema output. If it happens the provider
            # has broken its own contract, and a retry may genuinely help.
            raise ProviderError(
                "question provider returned unparseable JSON", retryable=True
            ) from exc

        questions = [q.strip() for q in parsed.get("questions", []) if q and q.strip()]
        usage = response.usage

        return QuestionResult(
            questions=questions[:count],
            usage=Usage(
                provider=PROVIDER,
                model=self._model,
                input_tokens=usage.prompt_tokens if usage else 0,
                output_tokens=usage.completion_tokens if usage else 0,
            ),
        )
