"""The worker's retry policy.

The only real logic in the worker is deciding what to retry, and it is worth
its own tests because getting it wrong is expensive in both directions: retry a
corrupt PDF and you burn three attempts over an hour to reach the same answer;
fail to retry a provider blip and a document stays broken until someone
notices.

No Redis and no database — ARQ's own machinery is ARQ's to test.
"""

from __future__ import annotations

import uuid
from typing import Any

import pytest

from soyl.application.rag.ingest_document import IngestionFailed
from soyl.infrastructure.queue.worker import MAX_TRIES, WorkerSettings, ingest


class Recorder:
    """Stands in for `ingest_document`, recording what it was asked to do."""

    def __init__(self, raises: BaseException | None = None) -> None:
        self.raises = raises
        self.calls = 0

    async def __call__(self, **kwargs: Any) -> Any:
        self.calls += 1
        if self.raises:
            raise self.raises

        class Result:
            chunk_count = 7
            page_count = 3

        return Result()


def context(settings: Any = None) -> dict[str, Any]:
    class Settings:
        questions_per_chunk = 3

    return {
        "settings": settings or Settings(),
        "session_factory": object(),
        "storage": object(),
        "embeddings": object(),
        "questions": object(),
    }


def ids() -> dict[str, str]:
    return {
        "tenant_id": str(uuid.uuid4()),
        "document_id": str(uuid.uuid4()),
        "job_id": str(uuid.uuid4()),
    }


async def test_a_successful_run_reports_what_it_produced(monkeypatch: pytest.MonkeyPatch) -> None:
    recorder = Recorder()
    monkeypatch.setattr("soyl.infrastructure.queue.worker.ingest_document", recorder)

    result = await ingest(context(), **ids())

    assert result == {"chunks": 7, "pages": 3}
    assert recorder.calls == 1


async def test_a_retryable_failure_is_raised_so_arq_tries_again(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A provider timeout deserves another attempt."""
    failure = IngestionFailed("provider unavailable", stage="embed", retryable=True)
    monkeypatch.setattr(
        "soyl.infrastructure.queue.worker.ingest_document", Recorder(raises=failure)
    )

    with pytest.raises(IngestionFailed):
        await ingest(context(), **ids())


async def test_a_permanent_failure_is_swallowed_rather_than_retried(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A corrupt PDF fails identically on every attempt.

    Raising would spend two more attempts over an hour to reach the same
    answer, and delay the moment the person who uploaded it sees the message.
    The failure is already recorded against the document, so returning marks
    the job done without losing anything.
    """
    failure = IngestionFailed("not a pdf", stage="extract", retryable=False)
    monkeypatch.setattr(
        "soyl.infrastructure.queue.worker.ingest_document", Recorder(raises=failure)
    )

    result = await ingest(context(), **ids())

    assert result == {"chunks": 0}


async def test_identifiers_survive_the_trip_through_redis(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Arguments cross the queue as JSON, so UUIDs arrive as strings.

    Parsing them at the boundary keeps that explicit rather than depending on a
    serialiser to round-trip a type it was never told about.
    """
    seen: dict[str, Any] = {}

    async def capture(**kwargs: Any) -> Any:
        seen.update(kwargs)

        class Result:
            chunk_count = 0
            page_count = 0

        return Result()

    monkeypatch.setattr("soyl.infrastructure.queue.worker.ingest_document", capture)

    identifiers = ids()
    await ingest(context(), **identifiers)

    for name in ("tenant_id", "document_id", "job_id"):
        assert isinstance(seen[name], uuid.UUID)
        assert str(seen[name]) == identifiers[name]


def test_the_worker_is_configured_the_way_the_deploy_assumes() -> None:
    """Guards the settings a second Railway service depends on.

    A `job_timeout` shorter than a large ingestion, or a `max_tries` of one,
    would both be silent behaviour changes rather than errors.
    """
    assert ingest in WorkerSettings.functions
    assert WorkerSettings.max_tries == MAX_TRIES >= 2
    # Generous for a 40-page PDF; the acceptance run took six seconds.
    assert WorkerSettings.job_timeout >= 300
    # Bounded, because each concurrent job holds a database connection.
    assert 1 <= WorkerSettings.max_jobs <= 16
