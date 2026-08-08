"""Choosing the embedding provider.

The one place that decides, so nothing else has to know there is a choice.

Absent credentials select the deterministic fake. That is deliberate for local
development and CI — the pipeline runs with no key, no network and no bill —
and `Settings.production_invariants` refuses to boot staging or production
without real ones, because the fake's vectors are not semantic and a corpus
built on them would look healthy while retrieving nonsense.
"""

from __future__ import annotations

import logging

from soyl.domain.ai.ports import (
    AdvisorProvider,
    AnswerProvider,
    EmbeddingProvider,
    QuestionProvider,
    RerankProvider,
    ConversationalAdvisorProvider,
)
from soyl.infrastructure.providers.azure_advisor import AzureOpenAIAdvisor
from soyl.infrastructure.providers.azure_conversational_advisor import AzureOpenAIConversationalAdvisor
from soyl.infrastructure.providers.azure_answers import AzureOpenAIAnswers
from soyl.infrastructure.providers.azure_openai import AzureOpenAIEmbeddings
from soyl.infrastructure.providers.azure_questions import AzureOpenAIQuestions
from soyl.infrastructure.providers.azure_rerank import AzureOpenAIRerank
from soyl.infrastructure.providers.fake import FakeEmbeddings
from soyl.infrastructure.providers.fake_advisor import FakeAdvisor, FakeConversationalAdvisor
from soyl.infrastructure.providers.fake_answers import FakeAnswers
from soyl.infrastructure.providers.fake_questions import FakeQuestions
from soyl.infrastructure.providers.fake_rerank import FakeRerank
from soyl.settings import Settings

logger = logging.getLogger("soyl.providers")


def build_embedding_provider(settings: Settings) -> EmbeddingProvider:
    if settings.azure_openai_endpoint and settings.azure_openai_api_key:
        return AzureOpenAIEmbeddings(
            endpoint=str(settings.azure_openai_endpoint),
            api_key=settings.azure_openai_api_key,
            deployment=settings.azure_openai_embedding_deployment,
            model=settings.azure_openai_embedding_model,
            dimensions=settings.embedding_dimensions,
            api_version=settings.azure_openai_api_version,
        )

    logger.warning(
        "no Azure OpenAI credentials; using the fake embedding provider. "
        "Its vectors are not semantic — retrieval quality cannot be measured with them."
    )
    return FakeEmbeddings(dimensions=settings.embedding_dimensions)


def build_question_provider(settings: Settings) -> QuestionProvider:
    if settings.azure_openai_endpoint and settings.azure_openai_api_key:
        return AzureOpenAIQuestions(
            endpoint=str(settings.azure_openai_endpoint),
            api_key=settings.azure_openai_api_key,
            deployment=settings.azure_openai_chat_deployment,
            model=settings.azure_openai_chat_model,
            api_version=settings.azure_openai_api_version,
        )

    logger.warning(
        "no Azure OpenAI credentials; using the fake question generator. "
        "Its questions are built from headings, not meaning."
    )
    return FakeQuestions()


def build_rerank_provider(settings: Settings) -> RerankProvider:
    """The LLM listwise fallback from §45.3, not the cross-encoder it prefers.

    Our Azure resource has an embedding deployment and a chat deployment, and
    no cross-encoder. When one exists this function is where it goes, and
    nothing above the port changes.
    """
    if settings.azure_openai_endpoint and settings.azure_openai_api_key:
        return AzureOpenAIRerank(
            endpoint=str(settings.azure_openai_endpoint),
            api_key=settings.azure_openai_api_key,
            deployment=settings.azure_openai_chat_deployment,
            model=settings.azure_openai_chat_model,
            api_version=settings.azure_openai_api_version,
        )

    logger.warning(
        "no Azure OpenAI credentials; using the fake reranker. "
        "It scores by word overlap, so precision@5 measured with it is meaningless."
    )
    return FakeRerank()


def build_answer_provider(settings: Settings) -> AnswerProvider:
    """The synthesiser (`UPDATE.md` §9).

    Same chat deployment as question generation and reranking. One deployment
    serving three jobs is a Phase 0 simplification, not a design: §35.3 routes
    each of them separately, and the day one of them needs a stronger model
    this is the function that changes.
    """
    if settings.azure_openai_endpoint and settings.azure_openai_api_key:
        return AzureOpenAIAnswers(
            endpoint=str(settings.azure_openai_endpoint),
            api_key=settings.azure_openai_api_key,
            deployment=settings.azure_openai_chat_deployment,
            model=settings.azure_openai_chat_model,
            api_version=settings.azure_openai_api_version,
        )

    logger.warning(
        "no Azure OpenAI credentials; using the fake synthesiser. "
        "It quotes the first chunk it is given and understands nothing."
    )
    return FakeAnswers()


def build_advisor_provider(settings: Settings) -> AdvisorProvider:
    """The public advisor. Anonymous traffic, so it is the one provider a
    visitor can reach without an account — see the rate limit on its route."""
    if settings.azure_openai_endpoint and settings.azure_openai_api_key:
        return AzureOpenAIAdvisor(
            endpoint=str(settings.azure_openai_endpoint),
            api_key=settings.azure_openai_api_key,
            deployment=settings.azure_openai_chat_deployment,
            model=settings.azure_openai_chat_model,
            api_version=settings.azure_openai_api_version,
        )

    logger.warning("no Azure OpenAI credentials; using the fake advisor.")
    return FakeAdvisor()


def build_conversational_advisor_provider(settings: Settings) -> ConversationalAdvisorProvider:
    """The multi-turn public advisor."""
    if settings.azure_openai_endpoint and settings.azure_openai_api_key:
        return AzureOpenAIConversationalAdvisor(
            endpoint=str(settings.azure_openai_endpoint),
            api_key=settings.azure_openai_api_key,
            deployment=settings.azure_openai_chat_deployment,
            model=settings.azure_openai_chat_model,
            api_version=settings.azure_openai_api_version,
        )

    logger.warning("no Azure OpenAI credentials; using the fake conversational advisor.")
    return FakeConversationalAdvisor()
