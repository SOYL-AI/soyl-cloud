"""The ingestion worker.

ARQ over Redis, per `UPDATE.md` §5. A separate *process* from the API, not a
separate codebase — it shares the domain, the repositories and the provider
seam, and is deployed as a second Railway service running a different command
against the same image. Duplicating the package to get a second process would
mean two copies of the tenancy model, which is the last thing worth
duplicating.

Retries are ARQ's, with one rule layered on top: **only retryable failures are
retried.** A corrupt PDF and a missing blob fail identically on every attempt,
so re-running them three times over an hour just delays the moment the person
who uploaded it sees the message.
"""

from __future__ import annotations

import logging
import uuid
from typing import Any, ClassVar

from arq.connections import RedisSettings

from soyl.application.rag.ingest_document import IngestionFailed, ingest_document
from soyl.infrastructure.db.session import create_engine, create_session_factory
from soyl.infrastructure.providers.factory import (
    build_embedding_provider,
    build_question_provider,
)
from soyl.infrastructure.storage.s3 import S3Storage
from soyl.settings import Settings, get_settings

logger = logging.getLogger("soyl.worker")

# Ingestion is IO-bound — storage, then a provider, then Postgres — so several
# documents can be in flight without competing for CPU. Bounded because each
# one holds a database connection at its edges.
MAX_JOBS = 4

# Two minutes per attempt is generous for a 40-page PDF and short enough that a
# hung provider call does not occupy a slot indefinitely.
JOB_TIMEOUT_SECONDS = 600

MAX_TRIES = 3


async def ingest(
    ctx: dict[str, Any],
    *,
    tenant_id: str,
    document_id: str,
    job_id: str,
) -> dict[str, int]:
    """One document. Enqueued by `POST /v1/documents/{id}/ingest`.

    Arguments are strings because they travel through Redis as JSON; parsing
    them here keeps the boundary explicit rather than depending on a serialiser
    to round-trip UUIDs.
    """
    settings: Settings = ctx["settings"]

    try:
        result = await ingest_document(
            factory=ctx["session_factory"],
            storage=ctx["storage"],
            embeddings=ctx["embeddings"],
            questions=ctx["questions"],
            questions_per_chunk=settings.questions_per_chunk,
            tenant_id=uuid.UUID(tenant_id),
            document_id=uuid.UUID(document_id),
            job_id=uuid.UUID(job_id),
        )
    except IngestionFailed as failure:
        if failure.retryable:
            # Let ARQ retry. The job row already records the stage and message,
            # so the UI shows what is happening while it does.
            raise

        # Permanent. Swallowing it marks the job complete rather than leaving
        # ARQ to burn two more attempts on bytes that will never parse — the
        # failure is already recorded against the document.
        logger.info(
            "ingestion permanently failed document=%s stage=%s", document_id, failure.stage
        )
        return {"chunks": 0}

    return {"chunks": result.chunk_count, "pages": result.page_count}


async def startup(ctx: dict[str, Any]) -> None:
    """Build everything the process owns, once.

    The same objects the API builds in its lifespan, for the same reason: a
    connection pool and an HTTP client per job would be a new pool and a new
    client per document.
    """
    settings = get_settings()
    engine = create_engine(str(settings.database_url))

    ctx["settings"] = settings
    ctx["engine"] = engine
    ctx["session_factory"] = create_session_factory(engine)
    ctx["embeddings"] = build_embedding_provider(settings)
    ctx["questions"] = build_question_provider(settings)
    ctx["storage"] = S3Storage(
        endpoint_url=str(settings.storage_endpoint_url) if settings.storage_endpoint_url else None,
        region=settings.storage_region,
        bucket=settings.storage_bucket,
        access_key=settings.storage_access_key,
        secret_key=settings.storage_secret_key,
    )

    logger.info(
        "worker ready environment=%s embeddings=%s",
        settings.environment,
        ctx["embeddings"].model,
    )


async def shutdown(ctx: dict[str, Any]) -> None:
    engine = ctx.get("engine")
    if engine is not None:
        await engine.dispose()


def redis_settings() -> RedisSettings:
    return RedisSettings.from_dsn(str(get_settings().redis_url))


class WorkerSettings:
    """ARQ's entrypoint: `arq soyl.infrastructure.queue.worker.WorkerSettings`."""

    # ARQ reads these as class attributes, so ClassVar is the accurate
    # annotation rather than a mutable default anyone might reassign.
    functions: ClassVar[list[Any]] = [ingest]
    on_startup = startup
    on_shutdown = shutdown
    max_jobs = MAX_JOBS
    job_timeout = JOB_TIMEOUT_SECONDS
    max_tries = MAX_TRIES
    # Keep finished jobs briefly so a status check right after completion still
    # finds something rather than an empty result.
    keep_result = 300

    @staticmethod
    def redis_settings() -> RedisSettings:
        return redis_settings()
