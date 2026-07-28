"""Documents, chunks and ingestion jobs.

Chunks are written with raw SQL rather than through the ORM, for one reason:
the `embedding` column is a pgvector type and the vector literal has to be
formatted as `[0.1,0.2,...]`. Doing that through a mapped attribute would mean
adding the `pgvector` package to describe a column nothing reads through the
ORM anyway — retrieval in M4 is hand-written SQL with a distance operator.

No method here filters on `tenant_id`. The session carries it and Postgres
applies it, exactly as in `PropertyRepository`.
"""

from __future__ import annotations

import uuid

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text

from soyl.infrastructure.db.models.rag import Document, IngestionJob


def vector_literal(values: list[float]) -> str:
    """Format a vector for pgvector.

    `repr` on a Python float round-trips exactly, which matters: a truncated
    literal silently changes the vector and therefore the ranking.
    """
    return "[" + ",".join(repr(float(value)) for value in values) + "]"


class DocumentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self,
        *,
        tenant_id: uuid.UUID,
        title: str,
        doc_type: str,
        blob_uri: str,
        checksum: str,
        property_ids: list[uuid.UUID] | None = None,
    ) -> Document:
        document = Document(
            tenant_id=tenant_id,
            title=title,
            doc_type=doc_type,
            blob_uri=blob_uri,
            checksum=checksum,
            property_ids=property_ids or [],
            status="uploaded",
        )
        self._session.add(document)
        await self._session.flush()
        return document

    async def get(self, document_id: uuid.UUID) -> Document | None:
        result = await self._session.execute(
            select(Document).where(Document.id == document_id, Document.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def find_by_checksum(self, checksum: str) -> Document | None:
        """Re-uploading the same bytes is a no-op, not a duplicate.

        Relies on the unique constraint for correctness; this is the friendly
        path that avoids provoking it.
        """
        result = await self._session.execute(
            select(Document).where(Document.checksum == checksum, Document.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def list_all(self) -> list[Document]:
        result = await self._session.execute(
            select(Document)
            .where(Document.deleted_at.is_(None))
            .order_by(Document.created_at.desc())
        )
        return list(result.scalars().all())

    async def set_status(
        self, document_id: uuid.UUID, status: str, *, page_count: int | None = None
    ) -> None:
        values: dict[str, object] = {"status": status}
        if page_count is not None:
            values["page_count"] = page_count

        await self._session.execute(
            update(Document).where(Document.id == document_id).values(**values)
        )

    async def delete(self, document_id: uuid.UUID) -> None:
        """A real delete, not a soft one.

        `ON DELETE CASCADE` takes the chunks and their questions with it. A
        soft-deleted document whose vectors remain in the index is not erased,
        and "destroy and certify" is a processor obligation we will be audited
        against.
        """
        await self._session.execute(
            text("DELETE FROM rag.document WHERE id = :id"), {"id": document_id}
        )


class ChunkRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def replace_all(
        self,
        *,
        document_id: uuid.UUID,
        tenant_id: uuid.UUID,
        property_ids: list[uuid.UUID],
        doc_type: str,
        chunks: list[dict[str, object]],
        embedding_model: str,
    ) -> int:
        """Write a document's chunks, replacing anything already there.

        Replacing rather than appending makes reprocessing idempotent: a
        retried job after a partial failure produces one clean set rather than
        a corpus with the first half of every document twice.
        """
        await self._session.execute(
            text("DELETE FROM rag.chunk WHERE document_id = :document_id"),
            {"document_id": document_id},
        )

        for chunk in chunks:
            await self._session.execute(
                text(
                    """
                    INSERT INTO rag.chunk (
                        document_id, tenant_id, property_ids, ordinal, heading_path,
                        content, context_header, keywords, doc_type, token_count,
                        embedding, embedding_model
                    ) VALUES (
                        :document_id, :tenant_id, :property_ids, :ordinal, :heading_path,
                        :content, :context_header, :keywords, :doc_type, :token_count,
                        CAST(:embedding AS vector), :embedding_model
                    )
                    """
                ),
                {
                    "document_id": document_id,
                    "tenant_id": tenant_id,
                    "property_ids": property_ids,
                    "ordinal": chunk["ordinal"],
                    "heading_path": chunk["heading_path"],
                    "content": chunk["content"],
                    "context_header": chunk["context_header"],
                    "keywords": chunk.get("keywords", []),
                    "doc_type": doc_type,
                    "token_count": chunk["token_count"],
                    "embedding": chunk["embedding"],
                    "embedding_model": embedding_model,
                },
            )

        return len(chunks)

    async def count_for_document(self, document_id: uuid.UUID) -> int:
        result = await self._session.execute(
            text("SELECT count(*) FROM rag.chunk WHERE document_id = :id"), {"id": document_id}
        )
        return int(result.scalar_one())


class IngestionJobRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, *, document_id: uuid.UUID, tenant_id: uuid.UUID) -> IngestionJob:
        job = IngestionJob(document_id=document_id, tenant_id=tenant_id, status="queued")
        self._session.add(job)
        await self._session.flush()
        return job

    async def get(self, job_id: uuid.UUID) -> IngestionJob | None:
        result = await self._session.execute(select(IngestionJob).where(IngestionJob.id == job_id))
        return result.scalar_one_or_none()

    async def latest_for_document(self, document_id: uuid.UUID) -> IngestionJob | None:
        result = await self._session.execute(
            select(IngestionJob)
            .where(IngestionJob.document_id == document_id)
            .order_by(IngestionJob.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def mark_running(self, job_id: uuid.UUID, stage: str) -> None:
        await self._session.execute(
            update(IngestionJob)
            .where(IngestionJob.id == job_id)
            .values(status="running", stage=stage, error=None, updated_at=text("now()"))
        )

    async def set_stage(self, job_id: uuid.UUID, stage: str) -> None:
        """Which step it reached.

        The difference between "extraction failed" and "embedding failed" is
        the difference between a scanned PDF and a provider outage, and the UI
        has to be able to say which.
        """
        await self._session.execute(
            update(IngestionJob)
            .where(IngestionJob.id == job_id)
            .values(stage=stage, updated_at=text("now()"))
        )

    async def mark_succeeded(self, job_id: uuid.UUID) -> None:
        await self._session.execute(
            update(IngestionJob)
            .where(IngestionJob.id == job_id)
            .values(status="succeeded", stage="done", error=None, updated_at=text("now()"))
        )

    async def mark_failed(self, job_id: uuid.UUID, *, stage: str, error: str) -> None:
        await self._session.execute(
            update(IngestionJob)
            .where(IngestionJob.id == job_id)
            .values(
                status="failed",
                stage=stage,
                # Truncated because it is rendered in the UI, and a wall of
                # text there is as unhelpful as no message at all.
                error=error[:1000],
                attempts=IngestionJob.attempts + 1,
                updated_at=text("now()"),
            )
        )
