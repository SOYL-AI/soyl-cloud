"""Core tenancy tables, per `UPDATE.md` §7.

Two deviations from the brief's column list, both explained in the M1 report:

- ``core.membership_property`` gains ``tenant_id``. The brief gives it only the
  two foreign keys, which leaves it the one tenant-scoped table RLS cannot
  protect directly. Reaching it through ``membership`` is not the same
  guarantee, and the schema-wide RLS assertion would have to special-case it.
- ``core.user_account`` deliberately has no ``tenant_id`` and no RLS. A user
  can hold memberships in several tenants, so tenancy lives on ``membership``.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import CITEXT, JSONB
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from soyl.infrastructure.db.base import Base, timestamp_column


def _uuid_pk() -> Mapped[uuid.UUID]:
    return mapped_column(
        PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )


class Tenant(Base):
    """A hotel group. The root of every scope in the system.

    RLS on this table keys on ``id``, not ``tenant_id`` — the tenant *is* the
    row. The schema-wide assertion in the isolation suite knows about this.
    """

    __tablename__ = "tenant"
    __table_args__ = (
        UniqueConstraint("slug", name="uq_tenant_slug"),
        CheckConstraint(
            "fiscal_year_start_month BETWEEN 1 AND 12",
            name="fiscal_year_start_month_is_a_month",
        ),
        CheckConstraint("status IN ('active', 'suspended')", name="status_is_known"),
        {"schema": "core"},
    )

    id: Mapped[uuid.UUID] = _uuid_pk()
    name: Mapped[str] = mapped_column(Text, nullable=False)
    slug: Mapped[str] = mapped_column(String(63), nullable=False)
    # ISO 3166-1 alpha-2. Not an enum: adding a country should not be a migration.
    country: Mapped[str] = mapped_column(String(2), nullable=False)
    # IANA zone name, e.g. "Asia/Kolkata". Every date boundary in the product
    # is the property's local one, so this is load-bearing, not decoration.
    timezone: Mapped[str] = mapped_column(Text, nullable=False, server_default="Asia/Kolkata")
    base_currency: Mapped[str] = mapped_column(String(3), nullable=False, server_default="INR")
    fiscal_year_start_month: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default="4"
    )
    status: Mapped[str] = mapped_column(Text, nullable=False, server_default="active")
    settings: Mapped[dict[str, object]] = mapped_column(JSONB, nullable=False, server_default="{}")
    created_at: Mapped[datetime] = timestamp_column(nullable=False, server_default=text("now()"))
    deleted_at: Mapped[datetime | None] = timestamp_column(nullable=True)


class Property(Base):
    """A single hotel."""

    __tablename__ = "property"
    __table_args__ = (
        Index(
            "ix_property_tenant_id_active",
            "tenant_id",
            postgresql_where=text("deleted_at IS NULL"),
        ),
        CheckConstraint("rooms_total >= 0", name="rooms_total_is_not_negative"),
        CheckConstraint(
            "rooms_sellable IS NULL OR rooms_sellable <= rooms_total",
            name="rooms_sellable_fits_in_rooms_total",
        ),
        CheckConstraint("status IN ('active', 'inactive')", name="status_is_known"),
        {"schema": "core"},
    )

    id: Mapped[uuid.UUID] = _uuid_pk()
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("core.tenant.id", ondelete="RESTRICT"), nullable=False
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    timezone: Mapped[str] = mapped_column(Text, nullable=False, server_default="Asia/Kolkata")
    currency: Mapped[str] = mapped_column(String(3), nullable=False, server_default="INR")
    rooms_total: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    rooms_sellable: Mapped[int | None] = mapped_column(Integer, nullable=True)
    segment: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(Text, nullable=False, server_default="active")
    created_at: Mapped[datetime] = timestamp_column(nullable=False, server_default=text("now()"))
    deleted_at: Mapped[datetime | None] = timestamp_column(nullable=True)


class UserAccount(Base):
    """A person. Deliberately not tenant-scoped — see the module docstring.

    ``password_hash`` is Argon2id, produced in the application (`UPDATE.md`
    §5). Nothing in the database hashes anything.
    """

    __tablename__ = "user_account"
    __table_args__ = (
        UniqueConstraint("email", name="uq_user_account_email"),
        CheckConstraint("status IN ('active', 'suspended')", name="status_is_known"),
        {"schema": "core"},
    )

    id: Mapped[uuid.UUID] = _uuid_pk()
    # citext: case-insensitive uniqueness enforced by the type, so
    # Priya@hotel.com and priya@hotel.com cannot both be registered.
    email: Mapped[str] = mapped_column(CITEXT, nullable=False)
    display_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    password_hash: Mapped[str | None] = mapped_column(Text, nullable=True)
    email_verified_at: Mapped[datetime | None] = timestamp_column(nullable=True)
    locale: Mapped[str] = mapped_column(Text, nullable=False, server_default="en")
    status: Mapped[str] = mapped_column(Text, nullable=False, server_default="active")
    created_at: Mapped[datetime] = timestamp_column(nullable=False, server_default=text("now()"))
    deleted_at: Mapped[datetime | None] = timestamp_column(nullable=True)


class Membership(Base):
    """A user's role within one tenant. This is where tenancy actually lives."""

    __tablename__ = "membership"
    __table_args__ = (
        UniqueConstraint("tenant_id", "user_id", name="uq_membership_tenant_id_user_id"),
        CheckConstraint(
            "role IN ('owner', 'admin', 'manager', 'analyst', 'soyl_staff')",
            name="role_is_known",
        ),
        CheckConstraint(
            "property_scope IN ('all', 'selected')",
            name="property_scope_is_known",
        ),
        {"schema": "core"},
    )

    id: Mapped[uuid.UUID] = _uuid_pk()
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("core.tenant.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("core.user_account.id", ondelete="CASCADE"),
        nullable=False,
    )
    role: Mapped[str] = mapped_column(Text, nullable=False)
    # 'all' means every property in the tenant, including ones created later.
    # 'selected' means the rows in membership_property and nothing else.
    property_scope: Mapped[str] = mapped_column(Text, nullable=False, server_default="all")
    created_at: Mapped[datetime] = timestamp_column(nullable=False, server_default=text("now()"))


class MembershipProperty(Base):
    """Which properties a 'selected'-scope membership can see.

    ``tenant_id`` is carried here rather than inferred through ``membership``
    so the row is directly protected by a policy of its own.
    """

    __tablename__ = "membership_property"
    __table_args__ = ({"schema": "core"},)

    membership_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("core.membership.id", ondelete="CASCADE"),
        primary_key=True,
    )
    property_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("core.property.id", ondelete="CASCADE"),
        primary_key=True,
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("core.tenant.id", ondelete="CASCADE"), nullable=False
    )
