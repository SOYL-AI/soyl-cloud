"""The multi-turn conversational advisor provider.

This talks to Azure OpenAI to drive a 3-5 turn conversation, profiling the
visitor before recommending specific SOYL products.
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
    ChatCompletionAssistantMessageParam,
)
from openai.types.shared_params import ResponseFormatJSONSchema

from soyl.domain.ai.advisor import strip_visitor_specific_figures, AdvisorInsight
from soyl.domain.ai.conversational_advisor import ChatResponse, ChatTurn
from soyl.domain.ai.ports import ProviderError, Usage
from soyl.domain.ai.soyl_knowledge import format_product_knowledge
from soyl.infrastructure.providers.pricing import USD_TO_INR, token_cost

logger = logging.getLogger("soyl.providers.advisor_chat")

PROVIDER = "azure_openai"

SYSTEM = """You are a knowledgeable hotel operations advisor chatting with a potential client on the SOYL website.
Your goal is to understand their property and challenges over a short 3-5 turn conversation, then provide a personalised insight and recommend relevant SOYL products.

## How to behave
1. Ask ONE clear question per turn during the "profiling" phase.
2. Adapt your questions to their previous answers. Don't ask about multi-property features if they said they are an independent hotel.
3. Provide 3-5 short options (chips) that they might click to answer. Make them natural and distinct.
4. Keep your messages conversational, concise, and honest. Avoid marketing fluff like "revolutionise" or "empower".
5. After you have gathered enough context (typically 3-5 turns), transition to the "insight" phase.
6. In the insight phase, provide a personalised insight reflecting their situation and suggest SOYL products that actually fit their needs. Don't oversell products that aren't a fit.
7. Set `phase` to "profiling" while you are still asking questions, and "insight" when you are providing the final recommendation.

## What you know, and what you do not
You know exactly what they tell you. You know nothing else about their business.
Never invent a specific figure about their property (e.g. "you will save 12%"). Any figure claiming to be about their specific property will be stripped out before they see it.
You may use general industry benchmarks ("hotels typically see...") and you may cite the actual pricing and features of SOYL products.

{product_knowledge}
"""

RESPONSE_FORMAT: ResponseFormatJSONSchema = {
    "type": "json_schema",
    "json_schema": {
        "name": "chat_response",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "message": {"type": "string"},
                "options": {
                    "type": "array",
                    "items": {"type": "string"}
                },
                "phase": {
                    "type": "string",
                    "enum": ["profiling", "insight"]
                },
                "insight": {
                    "type": ["object", "null"],
                    "properties": {
                        "headline": {"type": "string"},
                        "blocks": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "type": {
                                        "type": "string",
                                        "enum": ["text.markdown", "list.checklist", "alert.callout"]
                                    },
                                    "title": {"type": ["string", "null"]},
                                    "markdown": {"type": ["string", "null"]},
                                    "level": {
                                        "type": ["string", "null"],
                                        "enum": ["info", "warning", "critical"]
                                    },
                                    "items": {
                                        "type": "array",
                                        "items": {"type": "string"}
                                    }
                                },
                                "required": ["type", "title", "markdown", "level", "items"],
                                "additionalProperties": False
                            }
                        }
                    },
                    "required": ["headline", "blocks"],
                    "additionalProperties": False
                },
                "product_suggestions": {
                    "type": ["array", "null"],
                    "items": {
                        "type": "object",
                        "properties": {
                            "product": {"type": "string"},
                            "reason": {"type": "string"},
                            "relevance": {
                                "type": "string",
                                "enum": ["high", "medium", "low"]
                            }
                        },
                        "required": ["product", "reason", "relevance"],
                        "additionalProperties": False
                    }
                }
            },
            "required": ["message", "options", "phase", "insight", "product_suggestions"],
            "additionalProperties": False,
        }
    }
}


def _sanitise_response(response: ChatResponse, turn: ChatTurn) -> ChatResponse:
    """Apply the figure stripping rule to the response."""
    # We collect all things the user said as "allowed" figures
    allowed_texts = {msg.content for msg in turn.messages if msg.role == "user"}
    if turn.selected_option:
        allowed_texts.add(turn.selected_option)
        
    def safe_strip(text: str | None) -> str | None:
        if not text:
            return text
        return strip_visitor_specific_figures(text, allowed=allowed_texts)

    # We only strip the message and the insight. We don't strip options or reasons.
    response.message = safe_strip(response.message) or response.message
    
    if response.insight:
        response.insight.headline = safe_strip(response.insight.headline) or response.insight.headline
        for block in response.insight.blocks:
            block.markdown = safe_strip(block.markdown)
            block.items = [safe_strip(item) or item for item in block.items]
            
    return response


class AzureOpenAIConversationalAdvisor:
    """Implements `ConversationalAdvisorProvider`."""

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
        usd_to_inr: Decimal = USD_TO_INR,
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
            max_retries=1,
        )
        self._system_prompt = SYSTEM.format(product_knowledge=format_product_knowledge())

    @property
    def model(self) -> str:
        return self._model

    def cost_inr(self, input_tokens: int, output_tokens: int = 0) -> Decimal:
        return token_cost(
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            usd_per_million_input=self._in_price,
            usd_per_million_output=self._out_price,
            usd_to_inr=self._usd_to_inr,
        )

    async def chat(self, turn: ChatTurn) -> tuple[ChatResponse, Usage]:
        messages: list[ChatCompletionMessageParam] = [
            ChatCompletionSystemMessageParam(role="system", content=self._system_prompt)
        ]
        
        for msg in turn.messages:
            if msg.role == "user":
                messages.append(ChatCompletionUserMessageParam(role="user", content=msg.content))
            else:
                messages.append(ChatCompletionAssistantMessageParam(role="assistant", content=msg.content))
                
        if turn.selected_option:
            messages.append(ChatCompletionUserMessageParam(role="user", content=f"(Selected option: {turn.selected_option})"))

        try:
            response = await self._client.chat.completions.create(
                model=self._deployment,
                messages=messages,
                response_format=RESPONSE_FORMAT,
                max_completion_tokens=2000,
            )
        except (APITimeoutError, APIConnectionError, RateLimitError) as exc:
            raise ProviderError(
                f"conversational advisor unavailable: {type(exc).__name__}", retryable=True
            ) from exc
        except APIStatusError as exc:
            raise ProviderError(
                f"conversational advisor returned {exc.status_code}", retryable=exc.status_code >= 500
            ) from exc

        body = response.choices[0].message.content or "{}"
        try:
            chat_resp = ChatResponse.model_validate_json(body)
        except (json.JSONDecodeError, ValueError) as exc:
            raise ProviderError("advisor returned an unusable body", retryable=True) from exc

        # Ensure product suggestions is at least an empty list if null
        if chat_resp.product_suggestions is None:
            chat_resp.product_suggestions = []

        chat_resp = _sanitise_response(chat_resp, turn)

        usage = response.usage
        input_tokens = usage.prompt_tokens if usage else 0
        output_tokens = usage.completion_tokens if usage else 0
        return chat_resp, Usage(
            provider=PROVIDER,
            model=self._model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost_inr=self.cost_inr(input_tokens, output_tokens),
        )
