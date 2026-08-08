"""Multi-turn conversational advisor models.

This defines the contract between the API boundary and the LLM provider for the
multi-turn profiling experience.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from soyl.domain.ai.advisor import AdvisorInsight


class ChatMessage(BaseModel):
    """A single message in the conversation history."""

    model_config = ConfigDict(extra="forbid")

    role: Literal["user", "assistant"]
    content: str


class ChatTurn(BaseModel):
    """What the visitor sends each turn."""

    model_config = ConfigDict(extra="forbid")

    messages: list[ChatMessage]
    selected_option: str | None = None


class ProductSuggestion(BaseModel):
    """A recommendation for a specific SOYL product based on context."""

    model_config = ConfigDict(extra="forbid")

    product: str
    reason: str
    relevance: Literal["high", "medium", "low"]


class ChatResponse(BaseModel):
    """What the advisor returns each turn."""

    model_config = ConfigDict(extra="forbid")

    message: str
    options: list[str] = Field(default_factory=list)
    phase: Literal["profiling", "insight"]
    insight: AdvisorInsight | None = None
    product_suggestions: list[ProductSuggestion] = Field(default_factory=list)
