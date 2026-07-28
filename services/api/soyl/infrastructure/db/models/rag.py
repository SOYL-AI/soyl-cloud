"""The corpus tables.

`embedding` is deliberately untyped here. pgvector's SQLAlchemy type lives in
the `pgvector` package, and adding a dependency to describe a column we always
write as a literal — and never read through the ORM, because retrieval is
hand-written SQL with a distance operator — is not worth it. Migration 004
owns the real column type.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import CheckConstraint, ForeignKey, Integer, Text, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from soyl.infrastructure.db.base import Base, timestamp_column


def _uuid_pk() -> Mapped[uuid.UUID]:
    return mapped_column(
        PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )


class Document(Base):
    __tablename__ = "document"
    __table_args__ = (
        UniqueConstraint("tenant_id", "checksum", name="uq_document_tenant_id_checksum"),
        CheckConstraint(
            "status IN ('uploaded', 'processing', 'ready', 'failed', 'superseded')",
            name="status_is_known",
        ),
        {"schema": "rag"},
    )

    id: Mapped[uuid.UUID] = _uuid_pk()
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("core.tenant.id", ondelete="CASCADE"), nullable=False
    )
    property_ids: Mapped[list[uuid.UUID]] = mapped_column(
        ARRAY(PGUUID(as_uuid=True)), nullable=False, server_default="{}"
    )
    title: Mapped[str] = mapped_column(Text, nullable=False)
    doc_type: Mapped[str] = mapped_column(Text, nullable=False, server_default="other")
    language: Mapped[str] = mapped_column(Text, nullable=False, server_default="en")
    blob_uri: Mapped[str] = mapped_column(Text, nullable=False)
    checksum: Mapped[str] = mapped_column(Text, nullable=False)
    page_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    effective_from: Mapped[date | None] = mapped_column(nullable=True)
    expires_on: Mapped[date | None] = mapped_column(nullable=True)
    supersedes: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("rag.document.id", ondelete="SET NULL"), nullable=True
    )
    sensitivity: Mapped[str] = mapped_column(Text, nullable=False, server_default="internal")
    status: Mapped[str] = mapped_column(Text, nullable=False, server_default="uploaded")
    doc_metadata: Mapped[dict[str, object]] = mapped_column(
        "metadata", JSONB, nullable=False, server_default="{}"
    )
    created_at: Mapped[datetime] = timestamp_column(nullable=False, server_default=text("now()"))
    deleted_at: Mapped[datetime | None] = timestamp_column(nullable=True)


class IngestionJob(Base):
    __tablename__ = "ingestion_job"
    __table_args__ = (
        CheckConstraint(
            "status IN ('queued', 'running', 'succeeded', 'failed')", name="status_is_known"
        ),
        {"schema": "rag"},
    )

    id: Mapped[uuid.UUID] = _uuid_pk()
    document_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("rag.document.id", ondelete="CASCADE"), nullable=False
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("core.tenant.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[str] = mapped_column(Text, nullable=False, server_default="queued")
    stage: Mapped[str | None] = mapped_column(Text, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    created_at: Mapped[datetime] = timestamp_column(nullable=False, server_default=text("now()"))
    updated_at: Mapped[datetime] = timestamp_column(nullable=False, server_default=text("now()"))
