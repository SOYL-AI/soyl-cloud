"""The audit log.

Append-only from the application's side: `soyl_app` holds INSERT and SELECT and
nothing else, so there is no mapped path to update or delete a row and no grant
that would let one succeed.

Partitioned monthly on ``occurred_at``, which is why the primary key is
composite — Postgres requires the partition key in it.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, Text, text
from sqlalchemy.dialects.postgresql import INET, JSONB
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from soyl.infrastructure.db.base import Base, timestamp_column


class AuditLog(Base):
    __tablename__ = "log"
    __table_args__ = (
        CheckConstraint(
            "actor_kind IN ('user', 'system', 'anonymous')", name="actor_kind_is_known"
        ),
        CheckConstraint("outcome IN ('success', 'failure', 'denied')", name="outcome_is_known"),
        {
            "schema": "audit",
            # Alembic owns this table's DDL entirely: partitioning, the DEFAULT
            # partition and the monthly children are not expressible here.
            "info": {"managed_by_migration": True},
        },
    )

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    occurred_at: Mapped[datetime] = timestamp_column(
        primary_key=True, nullable=False, server_default=text("now()")
    )
    # Nullable: a failed login has no tenant. The policy uses IS NOT DISTINCT
    # FROM so those rows are writable and readable without a tenant context.
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(PGUUID(as_uuid=True), nullable=True)
    actor_kind: Mapped[str] = mapped_column(Text, nullable=False)
    actor_id: Mapped[uuid.UUID | None] = mapped_column(PGUUID(as_uuid=True), nullable=True)
    action: Mapped[str] = mapped_column(Text, nullable=False)
    resource_kind: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Text rather than uuid: some resources are identified by a slug or an
    # email, and an audit log that cannot record the identifier it saw is worse
    # than one with a loose type.
    resource_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    outcome: Mapped[str] = mapped_column(Text, nullable=False)
    ip: Mapped[str | None] = mapped_column(INET, nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    trace_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    before: Mapped[dict[str, object] | None] = mapped_column(JSONB, nullable=True)
    after: Mapped[dict[str, object] | None] = mapped_column(JSONB, nullable=True)
