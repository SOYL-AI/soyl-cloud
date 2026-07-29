"""The public advisor's one model call.

Separate from `azure_answers` because the two have opposite instructions. The
answer synthesiser is told to say nothing that is not in the sources; this one
has no sources and is told to say nothing that is not in the visitor's own
answers. Sharing a module would mean one prompt trying to be both, and the
edits that keep one honest would loosen the other.
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

from soyl.domain.ai.advisor import AdvisorAnswers, AdvisorInsight, sanitise
from soyl.domain.ai.ports import ProviderError, Usage

logger = logging.getLogger("soyl.providers.advisor")

PROVIDER = "azure_openai"

SYSTEM = """You are advising someone who runs a hotel and has just answered a \
few questions on a website. They have not signed up and have uploaded nothing.

## What you know, and what you do not

You know exactly what they told you. You know nothing else about their \
business: not their occupancy, not their revenue, not their costs, not what \
"hotels like theirs" do.

**Never invent a figure.** No percentages, no rupee or dollar amounts, no \
"typically saves X hours a week", no industry benchmarks, no comparisons to \
other properties. You do not have that data and a plausible number is worse \
than no number, because the person reading it runs the property and will know \
it is wrong. Any figure you write that they did not give you is removed before \
they see it, which will leave a dash in the middle of your sentence.

## What to actually do

Reflect their situation back with more structure than they had, and be \
specific about what changes. A property with 25-60 rooms and one person \
answering questions has a different problem from a five-property group with \
twenty — say what *their* version of the problem is.

Be concrete about the failure they described. "Finding the right clause in a \
contract" means somebody opens a PDF and scrolls; name that, and name what \
replaces it. Do not describe software features. Describe what a shift looks \
like afterwards.

Say plainly what SOYL would not help with, if something in their answer is \
outside it. SOYL answers questions from documents they upload. It is not a PMS, \
not a channel manager, not a booking engine. Being straight about that earns \
more than pretending otherwise.

## Shape

- `headline`: one sentence naming their specific situation. Not a greeting, not \
  a slogan. Something they would recognise as about them.
- 2 to 4 blocks:
  - `text.markdown` for the reflection and what changes. Two or three sentences \
    each. Most blocks should be this.
  - `list.checklist` for questions they specifically would ask on day one, \
    drawn from what they said. Use their words.
  - `alert.callout` with level "info" only if there is something honest to flag \
    about fit.

Write like a consultant who has done this before and has no interest in \
overselling. Short sentences. No exclamation marks. No "unlock", "leverage", \
"empower", "seamless", "revolutionise".
"""

RESPONSE_FORMAT: ResponseFormatJSONSchema = {
    "type": "json_schema",
    "json_schema": {
        "name": "advisor_insight",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "headline": {"type": "string"},
                "blocks": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "type": {
                                "type": "string",
                                "enum": [
                                    "text.markdown",
                                    "list.checklist",
                                    "alert.callout",
                                ],
                            },
                            "title": {"type": ["string", "null"]},
                            "markdown": {"type": ["string", "null"]},
                            "level": {
                                "type": ["string", "null"],
                                "enum": ["info", "warning", "critical", None],
                            },
                            "items": {"type": "array", "items": {"type": "string"}},
                        },
                        "required": ["type", "title", "markdown", "level", "items"],
                        "additionalProperties": False,
                    },
                },
            },
            "required": ["headline", "blocks"],
            "additionalProperties": False,
        },
    },
}


class AzureOpenAIAdvisor:
    """Implements `AdvisorProvider`."""

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
        timeout_seconds: float = 45.0,
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
            max_retries=1,
        )

    @property
    def model(self) -> str:
        return self._model

    async def advise(self, answers: AdvisorAnswers) -> tuple[AdvisorInsight, Usage]:
        filled = answers.filled()
        if not filled:
            raise ProviderError("no answers to advise on")

        described = "\n".join(
            f"- {key.replace('_', ' ')}: {value}" for key, value in filled.items()
        )
        prompt = (
            "Here is what they told us:\n\n"
            f"{described}\n\n"
            "Write the insight. Remember: nothing you say may depend on a number "
            "they did not give you."
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
                max_completion_tokens=1400,
            )
        except (APITimeoutError, APIConnectionError, RateLimitError) as exc:
            raise ProviderError(
                f"advisor unavailable: {type(exc).__name__}", retryable=True
            ) from exc
        except APIStatusError as exc:
            raise ProviderError(
                f"advisor returned {exc.status_code}", retryable=exc.status_code >= 500
            ) from exc

        body = response.choices[0].message.content or "{}"
        try:
            insight = AdvisorInsight.model_validate_json(body)
        except (json.JSONDecodeError, ValueError) as exc:
            raise ProviderError("advisor returned an unusable body", retryable=True) from exc

        usage = response.usage
        return sanitise(insight, answers=answers), Usage(
            provider=PROVIDER,
            model=self._model,
            input_tokens=usage.prompt_tokens if usage else 0,
            output_tokens=usage.completion_tokens if usage else 0,
        )
