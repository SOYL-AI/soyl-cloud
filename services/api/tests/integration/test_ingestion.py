"""The ingestion pipeline, end to end.

Real Postgres, real MinIO, and the fake embedding provider — which is the right
choice here because these assertions are about the *pipeline*, not about
retrieval quality. Whether the vectors mean anything is proved separately in
`test_azure_embeddings.py` against the live deployment; whether the pipeline
stores them against the right chunks, in the right tenant, with the right
status, is this file.
"""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator

import pymupdf
import pytest
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker
from sqlalchemy.sql import text

from soyl.application.rag.ingest_document import IngestionFailed, ingest_document
from soyl.domain.storage import document_key
from soyl.infrastructure.db.repositories.document_repository import (
    ChunkRepository,
    DocumentRepository,
    IngestionJobRepository,
)
from soyl.infrastructure.db.session import create_session_factory, tenant_session
from soyl.infrastructure.providers.fake import FakeEmbeddings
from soyl.infrastructure.storage.s3 import S3Storage
from tests.conftest import ApiTestSettings

SOP = """# Guest Complaint Handling SOP

This procedure applies to all front-of-house staff at every property.

## 1. Receiving a complaint

Listen without interrupting. Record the room number and the time of the report.
Do not promise a remedy before the facts are established.

## 2. Resolution within the shift

Most complaints are resolved by the duty manager within the same shift. Record
what was done and what it cost.

## 3. Escalation

Complaints not resolved within fifteen minutes are escalated to the general
manager on duty.

### 3.2 Noise complaints after 22:00

If a guest reports noise after 22:00, the duty manager must attend within ten
minutes. Do not offer compensation before verifying the complaint with a second
member of staff.

## 4. Cancellation and refunds

Corporate reservations may be cancelled without penalty up to 48 hours before
arrival. Leisure bookings follow the rate plan attached to the reservation.
"""


@pytest.fixture
async def storage(settings: ApiTestSettings) -> AsyncIterator[S3Storage]:
    store = S3Storage(
        endpoint_url=str(settings.storage_endpoint_url),
        region="us-east-1",
        bucket=settings.storage_bucket,
        access_key=settings.storage_access_key,
        secret_key=settings.storage_secret_key,
    )
    await store.ensure_bucket()
    yield store


@pytest.fixture
def factory(app_engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    return create_session_factory(app_engine)


@pytest.fixture
async def tenant(migrator_engine: AsyncEngine) -> AsyncIterator[uuid.UUID]:
    """A tenant to own the documents, created and torn down around each test."""
    tenant_id = uuid.uuid4()
    factory = create_session_factory(migrator_engine)

    async with tenant_session(factory, tenant_id) as session:
        await session.execute(
            text(
                "INSERT INTO core.tenant (id, name, slug, country) "
                "VALUES (:id, 'Ingest Test', :slug, 'IN')"
            ),
            {"id": tenant_id, "slug": f"ingest-{uuid.uuid4().hex[:10]}"},
        )

    yield tenant_id

    async with migrator_engine.connect() as connection:
        await connection.execute(
            text("DELETE FROM core.tenant WHERE id = :id"), {"id": tenant_id}
        )
        await connection.commit()


async def upload(
    storage: S3Storage, tenant_id: uuid.UUID, document_id: uuid.UUID, data: bytes, filename: str
) -> str:
    """Put bytes where the pipeline will look for them."""
    key = document_key(tenant_id=tenant_id, document_id=document_id, filename=filename)
    ticket = await storage.upload_ticket(
        key=key, content_type="application/octet-stream", max_bytes=len(data) + 1
    )

    import httpx

    async with httpx.AsyncClient() as client:
        response = await client.put(ticket.url, content=data, headers=ticket.required_headers)
    assert response.status_code in (200, 204)
    return key


async def prepare(
    factory: async_sessionmaker[AsyncSession],
    storage: S3Storage,
    tenant_id: uuid.UUID,
    *,
    data: bytes,
    filename: str,
    doc_type: str = "sop",
) -> tuple[uuid.UUID, uuid.UUID]:
    document_id = uuid.uuid4()
    key = await upload(storage, tenant_id, document_id, data, filename)

    async with tenant_session(factory, tenant_id) as session:
        await session.execute(
            text(
                "INSERT INTO rag.document (id, tenant_id, title, doc_type, blob_uri, checksum) "
                "VALUES (:id, :tenant_id, :title, :doc_type, :uri, :checksum)"
            ),
            {
                "id": document_id,
                "tenant_id": tenant_id,
                "title": filename,
                "doc_type": doc_type,
                "uri": key,
                "checksum": uuid.uuid4().hex,
            },
        )
        job = await IngestionJobRepository(session).create(
            document_id=document_id, tenant_id=tenant_id
        )
        job_id = job.id

    return document_id, job_id


def make_pdf(pages: list[str]) -> bytes:
    document = pymupdf.open()
    for body in pages:
        page = document.new_page()
        for index, line in enumerate(body.split("\n")):
            page.insert_text((72, 72 + index * 14), line, fontsize=11)
    data: bytes = document.tobytes()
    document.close()
    return data


# ── The happy path ──────────────────────────────────────────────────────────


async def test_a_markdown_sop_becomes_queryable_chunks(
    factory: async_sessionmaker[AsyncSession],
    storage: S3Storage,
    tenant: uuid.UUID,
) -> None:
    document_id, job_id = await prepare(
        factory, storage, tenant, data=SOP.encode(), filename="complaint-sop.md"
    )

    result = await ingest_document(
        factory=factory,
        storage=storage,
        embeddings=FakeEmbeddings(),
        tenant_id=tenant,
        document_id=document_id,
        job_id=job_id,
    )

    assert result.chunk_count > 0

    async with tenant_session(factory, tenant) as session:
        document = await DocumentRepository(session).get(document_id)
        job = await IngestionJobRepository(session).get(job_id)
        count = await ChunkRepository(session).count_for_document(document_id)

    assert document is not None and document.status == "ready"
    assert job is not None and job.status == "succeeded" and job.error is None
    assert count == result.chunk_count


async def test_chunks_carry_their_heading_path_and_an_embedding(
    factory: async_sessionmaker[AsyncSession],
    storage: S3Storage,
    tenant: uuid.UUID,
) -> None:
    """What makes a chunk retrievable rather than merely stored."""
    document_id, job_id = await prepare(
        factory, storage, tenant, data=SOP.encode(), filename="complaint-sop.md"
    )
    await ingest_document(
        factory=factory,
        storage=storage,
        embeddings=FakeEmbeddings(),
        tenant_id=tenant,
        document_id=document_id,
        job_id=job_id,
    )

    async with tenant_session(factory, tenant) as session:
        rows = (
            await session.execute(
                text(
                    "SELECT heading_path, context_header, embedding IS NOT NULL AS has_vector, "
                    "content_tsv IS NOT NULL AS has_tsv, token_count "
                    "FROM rag.chunk WHERE document_id = :id ORDER BY ordinal"
                ),
                {"id": document_id},
            )
        ).all()

    assert rows
    assert all(row.has_vector for row in rows)
    # Generated column — hybrid retrieval depends on it existing for every row.
    assert all(row.has_tsv for row in rows)
    assert all(row.token_count > 0 for row in rows)

    noise = next(row for row in rows if "22:00" in " ".join(row.heading_path))
    assert "3. Escalation" in noise.heading_path
    # §43.2: the header is stored because it is what was embedded.
    assert "Guest Complaint Handling SOP" in noise.context_header
    assert "3.2 Noise complaints after 22:00" in noise.context_header


async def test_every_model_call_reaches_the_usage_ledger(
    factory: async_sessionmaker[AsyncSession],
    storage: S3Storage,
    tenant: uuid.UUID,
) -> None:
    """§6.6, from the first model call rather than from whenever we remember."""
    document_id, job_id = await prepare(
        factory, storage, tenant, data=SOP.encode(), filename="complaint-sop.md"
    )
    await ingest_document(
        factory=factory,
        storage=storage,
        embeddings=FakeEmbeddings(),
        tenant_id=tenant,
        document_id=document_id,
        job_id=job_id,
    )

    async with tenant_session(factory, tenant) as session:
        rows = (
            await session.execute(
                text(
                    "SELECT kind, provider, model, input_tokens "
                    "FROM billing.usage_ledger WHERE tenant_id = :id"
                ),
                {"id": tenant},
            )
        ).all()

    assert rows, "an embedding run wrote no ledger rows"
    assert all(row.kind == "embed" for row in rows)
    assert all(row.input_tokens > 0 for row in rows)


async def test_reprocessing_replaces_rather_than_duplicates(
    factory: async_sessionmaker[AsyncSession],
    storage: S3Storage,
    tenant: uuid.UUID,
) -> None:
    """A retry after a partial failure must not leave the corpus doubled."""
    document_id, job_id = await prepare(
        factory, storage, tenant, data=SOP.encode(), filename="complaint-sop.md"
    )

    first = await ingest_document(
        factory=factory, storage=storage, embeddings=FakeEmbeddings(),
        tenant_id=tenant, document_id=document_id, job_id=job_id,
    )
    second = await ingest_document(
        factory=factory, storage=storage, embeddings=FakeEmbeddings(),
        tenant_id=tenant, document_id=document_id, job_id=job_id,
    )

    async with tenant_session(factory, tenant) as session:
        count = await ChunkRepository(session).count_for_document(document_id)

    assert first.chunk_count == second.chunk_count == count


# ── Failing well ────────────────────────────────────────────────────────────


async def test_a_corrupt_pdf_fails_readably_and_is_not_retried(
    factory: async_sessionmaker[AsyncSession],
    storage: S3Storage,
    tenant: uuid.UUID,
) -> None:
    """M3's acceptance criterion, through the real pipeline."""
    document_id, job_id = await prepare(
        factory, storage, tenant, data=b"%PDF-1.7 not really a pdf", filename="broken.pdf"
    )

    with pytest.raises(IngestionFailed) as raised:
        await ingest_document(
            factory=factory, storage=storage, embeddings=FakeEmbeddings(),
            tenant_id=tenant, document_id=document_id, job_id=job_id,
        )

    assert raised.value.stage == "extract"
    assert raised.value.retryable is False

    async with tenant_session(factory, tenant) as session:
        document = await DocumentRepository(session).get(document_id)
        job = await IngestionJobRepository(session).get(job_id)

    assert document is not None and document.status == "failed"
    assert job is not None and job.status == "failed"
    # Readable, and it names the stage so the UI can say which step went wrong.
    assert job.stage == "extract"
    assert "could not be opened" in (job.error or "")
    assert "Traceback" not in (job.error or "")


async def test_a_missing_blob_is_permanent_not_retryable(
    factory: async_sessionmaker[AsyncSession],
    storage: S3Storage,
    tenant: uuid.UUID,
) -> None:
    document_id = uuid.uuid4()

    async with tenant_session(factory, tenant) as session:
        await session.execute(
            text(
                "INSERT INTO rag.document (id, tenant_id, title, doc_type, blob_uri, checksum) "
                "VALUES (:id, :tenant_id, 'ghost.pdf', 'sop', :uri, :checksum)"
            ),
            {
                "id": document_id,
                "tenant_id": tenant,
                "uri": document_key(
                    tenant_id=tenant, document_id=document_id, filename="ghost.pdf"
                ),
                "checksum": uuid.uuid4().hex,
            },
        )
        job = await IngestionJobRepository(session).create(
            document_id=document_id, tenant_id=tenant
        )
        job_id = job.id

    with pytest.raises(IngestionFailed) as raised:
        await ingest_document(
            factory=factory, storage=storage, embeddings=FakeEmbeddings(),
            tenant_id=tenant, document_id=document_id, job_id=job_id,
        )

    assert raised.value.stage == "download"
    # Re-running will not conjure the bytes; retrying is wasted effort.
    assert raised.value.retryable is False


async def test_a_scanned_pdf_is_refused_rather_than_indexed_empty(
    factory: async_sessionmaker[AsyncSession],
    storage: S3Storage,
    tenant: uuid.UUID,
) -> None:
    blank = pymupdf.open()
    for _ in range(3):
        blank.new_page()
    data = blank.tobytes()
    blank.close()

    document_id, job_id = await prepare(
        factory, storage, tenant, data=data, filename="scan.pdf"
    )

    with pytest.raises(IngestionFailed) as raised:
        await ingest_document(
            factory=factory, storage=storage, embeddings=FakeEmbeddings(),
            tenant_id=tenant, document_id=document_id, job_id=job_id,
        )

    assert "scanned" in str(raised.value).lower()


# ── Isolation ───────────────────────────────────────────────────────────────


async def test_chunks_are_invisible_to_another_tenant(
    factory: async_sessionmaker[AsyncSession],
    storage: S3Storage,
    tenant: uuid.UUID,
    migrator_engine: AsyncEngine,
) -> None:
    """The corpus is the most sensitive thing we hold.

    RLS covers rag.* by construction, but a document is the material the whole
    product exists to protect, so it gets its own assertion rather than relying
    on the schema-wide one.
    """
    document_id, job_id = await prepare(
        factory, storage, tenant, data=SOP.encode(), filename="complaint-sop.md"
    )
    await ingest_document(
        factory=factory, storage=storage, embeddings=FakeEmbeddings(),
        tenant_id=tenant, document_id=document_id, job_id=job_id,
    )

    other = uuid.uuid4()
    async with tenant_session(factory, other) as session:
        visible = (
            await session.execute(text("SELECT count(*) FROM rag.chunk"))
        ).scalar_one()
        documents = (
            await session.execute(text("SELECT count(*) FROM rag.document"))
        ).scalar_one()

    assert visible == 0
    assert documents == 0
