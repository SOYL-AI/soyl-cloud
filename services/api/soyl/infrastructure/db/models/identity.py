"""Sessions, credential tokens and linked OAuth identities.

All three are untenanted by design — see migration 002's docstring. Every
secret is stored as a SHA-256 digest in a ``bytea``; nothing here holds a value
that could be replayed.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, ForeignKey, Index, LargeBinary, Text, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import INET
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from soyl.infrastructure.db.base import Base, timestamp_column


class Session(Base):
    __tablename__ = "session"
    __table_args__ = (
        UniqueConstraint("token_hash", name="uq_session_token_hash"),
        Index("ix_session_user_id", "user_id"),
        Index("ix_session_expires_at", "expires_at"),
        {"schema": "core"},
    )

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("core.user_account.id", ondelete="CASCADE"),
        nullable=False,
    )
    # Nullable: a user with no membership yet still has a valid session. They
    # simply cannot reach tenant-scoped data with it.
    active_tenant_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("core.tenant.id", ondelete="CASCADE"), nullable=True
    )
    token_hash: Mapped[bytes] = mapped_column(LargeBinary(32), nullable=False)
    expires_at: Mapped[datetime] = timestamp_column(nullable=False)
    created_at: Mapped[datetime] = timestamp_column(nullable=False, server_default=text("now()"))
    last_seen_at: Mapped[datetime] = timestamp_column(nullable=False, server_default=text("now()"))
    revoked_at: Mapped[datetime | None] = timestamp_column(nullable=True)
    ip: Mapped[str | None] = mapped_column(INET, nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Non-null means staff minted this session on the account owner's behalf
    # (migration 007). Everything that resolves a session can therefore tell,
    # which is what makes the banner possible and the audit trail honest.
    impersonated_by: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("core.user_account.id", ondelete="CASCADE"), nullable=True
    )


class CredentialToken(Base):
    __tablename__ = "credential_token"
    __table_args__ = (
        UniqueConstraint("token_hash", name="uq_credential_token_token_hash"),
        CheckConstraint(
            "kind IN ('email_verify', 'password_reset')", name="kind_is_known"
        ),
        Index("ix_credential_token_user_id_kind", "user_id", "kind"),
        {"schema": "core"},
    )

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("core.user_account.id", ondelete="CASCADE"),
        nullable=False,
    )
    kind: Mapped[str] = mapped_column(Text, nullable=False)
    token_hash: Mapped[bytes] = mapped_column(LargeBinary(32), nullable=False)
    expires_at: Mapped[datetime] = timestamp_column(nullable=False)
    # Single-use. Set in the same transaction as whatever the token authorised.
    consumed_at: Mapped[datetime | None] = timestamp_column(nullable=True)
    created_at: Mapped[datetime] = timestamp_column(nullable=False, server_default=text("now()"))


class OAuthAccount(Base):
    __tablename__ = "oauth_account"
    __table_args__ = (
        UniqueConstraint(
            "provider", "provider_account_id", name="uq_oauth_account_provider_provider_account_id"
        ),
        CheckConstraint("provider IN ('google')", name="provider_is_known"),
        {"schema": "core"},
    )

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("core.user_account.id", ondelete="CASCADE"),
        nullable=False,
    )
    provider: Mapped[str] = mapped_column(Text, nullable=False)
    # The provider's stable subject id, never the email.
    provider_account_id: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = timestamp_column(nullable=False, server_default=text("now()"))
