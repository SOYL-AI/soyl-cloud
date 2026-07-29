"""FastAPI app factory and lifespan.

Everything the process owns — the engine, the session factory, the Redis
client — is created once at startup and closed once at shutdown, and lives on
``app.state``. No module-level singletons: a test needs to build an app against
a different database, and a module-level engine makes that impossible.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from redis.asyncio import Redis

from soyl.infrastructure.db.session import create_engine, create_session_factory
from soyl.infrastructure.email import EmailSender
from soyl.infrastructure.providers.factory import (
    build_advisor_provider,
    build_answer_provider,
    build_embedding_provider,
    build_question_provider,
    build_rerank_provider,
)
from soyl.infrastructure.storage.s3 import S3Storage
from soyl.interface.http.errors import register_exception_handlers
from soyl.interface.http.v1.router import router as v1_router
from soyl.settings import Settings, get_settings


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings: Settings = app.state.settings

    engine = create_engine(str(settings.database_url))
    app.state.engine = engine
    app.state.session_factory = create_session_factory(engine)
    app.state.redis = Redis.from_url(str(settings.redis_url), decode_responses=True)
    # Stateless, so one instance is fine. Unconfigured is a valid state: local
    # development logs the verification link instead of sending it.
    app.state.embeddings = build_embedding_provider(settings)
    app.state.questions = build_question_provider(settings)
    app.state.answers = build_answer_provider(settings)
    app.state.reranker = build_rerank_provider(settings)
    app.state.advisor = build_advisor_provider(settings)
    app.state.storage = S3Storage(
        endpoint_url=str(settings.storage_endpoint_url) if settings.storage_endpoint_url else None,
        region=settings.storage_region,
        bucket=settings.storage_bucket,
        access_key=settings.storage_access_key,
        secret_key=settings.storage_secret_key,
    )
    app.state.email_sender = EmailSender(
        api_key=settings.resend_api_key, from_address=settings.email_from
    )

    try:
        yield
    finally:
        await app.state.redis.aclose()
        await engine.dispose()


def create_app(settings: Settings | None = None) -> FastAPI:
    resolved = settings or get_settings()

    app = FastAPI(
        title="SOYL API",
        version="0.1.0",
        lifespan=lifespan,
        # No interactive docs outside development. The schema is not secret,
        # but an unauthenticated request builder pointed at production is an
        # invitation nobody needs to send.
        docs_url="/docs" if resolved.environment in ("local", "preview") else None,
        redoc_url=None,
        openapi_url="/openapi.json" if resolved.environment in ("local", "preview") else None,
    )
    app.state.settings = resolved

    register_exception_handlers(app)
    app.include_router(v1_router)

    return app
