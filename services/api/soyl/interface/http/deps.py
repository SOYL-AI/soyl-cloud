"""FastAPI dependencies.

Everything the routes need comes from ``app.state``, which the lifespan filled.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Header, HTTPException, Request, status
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker

from soyl.domain.ai.ports import (
    AdvisorProvider,
    AnswerProvider,
    EmbeddingProvider,
    RerankProvider,
    ConversationalAdvisorProvider,
)
from soyl.domain.storage import StoragePort
from soyl.infrastructure.email import EmailSender
from soyl.settings import Settings


def get_settings_dep(request: Request) -> Settings:
    return request.app.state.settings  # type: ignore[no-any-return]


def get_engine(request: Request) -> AsyncEngine:
    return request.app.state.engine  # type: ignore[no-any-return]


def get_session_factory(request: Request) -> async_sessionmaker[AsyncSession]:
    return request.app.state.session_factory  # type: ignore[no-any-return]


def get_redis(request: Request) -> Redis:
    return request.app.state.redis  # type: ignore[no-any-return]


def get_email_sender(request: Request) -> EmailSender:
    return request.app.state.email_sender  # type: ignore[no-any-return]


def get_storage(request: Request) -> StoragePort:
    return request.app.state.storage  # type: ignore[no-any-return]


def get_embeddings(request: Request) -> EmbeddingProvider:
    return request.app.state.embeddings  # type: ignore[no-any-return]


def get_answers(request: Request) -> AnswerProvider:
    return request.app.state.answers  # type: ignore[no-any-return]


def get_reranker(request: Request) -> RerankProvider:
    return request.app.state.reranker  # type: ignore[no-any-return]


def get_advisor(request: Request) -> AdvisorProvider:
    return request.app.state.advisor  # type: ignore[no-any-return]


def get_conversational_advisor(request: Request) -> ConversationalAdvisorProvider:
    return request.app.state.conversational_advisor  # type: ignore[no-any-return]


def require_lead_token(
    settings: Annotated[Settings, Depends(get_settings_dep)],
    authorization: Annotated[str | None, Header()] = None,
) -> None:
    """Guards POST /v1/leads.

    The lead endpoint is reachable before any user exists, so it cannot be
    protected by a session. A shared bearer token between the web app and the
    API is the smallest thing that stops the endpoint being an open write.

    Compared with ``compare_digest`` so the check does not leak the token's
    length through timing. Replaced by the signed JWT exchange in M2.
    """
    import hmac

    presented = ""
    if authorization and authorization.lower().startswith("bearer "):
        presented = authorization[7:]

    if not hmac.compare_digest(presented, settings.lead_ingest_token):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
