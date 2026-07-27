"""The contact-form lead.

**Deliberately not tenant-scoped.** A lead arrives from a stranger on the
marketing site, before any tenant exists, so a ``tenant_id`` here would be a
column that is always null and means nothing. It has no RLS policy, and the
schema-wide assertion in the isolation suite is written so that this table is
an explicit, named exception rather than an accidental pass.

It lives in ``public`` rather than ``core`` for the same reason: it is not part
of the tenancy model.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, Index, Text, text
from sqlalchemy.dialects.postgresql import CITEXT
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from soyl.infrastructure.db.base import Base, timestamp_column


class Lead(Base):
    __tablename__ = "lead"
    __table_args__ = (
        Index("ix_lead_created_at", text("created_at DESC")),
        CheckConstraint("length(message) BETWEEN 1 AND 5000", name="message_is_bounded"),
        {
            "schema": "public",
            "comment": (
                "Contact-form submissions. NOT tenant-scoped and has no RLS policy "
                "by design: a lead arrives before any tenant exists. Do not add "
                "tenant_id here — see docs/phase-0/DECISION-LOG.md."
            ),
        },
    )

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    email: Mapped[str] = mapped_column(CITEXT, nullable=False)
    company: Mapped[str] = mapped_column(Text, nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    # The page the form was submitted from. Cheap attribution while we have no
    # other way to tell a /contact lead from one that came via a blog post.
    source_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = timestamp_column(nullable=False, server_default=text("now()"))
