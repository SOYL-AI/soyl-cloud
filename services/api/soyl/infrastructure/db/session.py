"""Database engine and the two ways to get a session.

The distinction here is the whole tenancy model, so it is worth being explicit:

``tenant_session``    sets ``app.tenant_id`` transaction-locally and is how
                      every tenant-scoped read and write happens.
``untenanted_session`` sets nothing, and is only for tables that have no
                      ``tenant_id`` at all — ``public.lead`` is the only one in
                      Phase 0, because a lead arrives before any tenant exists.
``staff_session``     sets ``app.staff_id`` and **reads across every tenant**.

Until M6 this file said there were two options and that a query needing to
cross tenants "is a conversation, not a helper". `UPDATE.md` §11 is that
conversation: an admin panel whose questions list, funnel and cost screens are
cross-tenant aggregates by definition.

``staff_session`` is the outcome, and it is narrower than it sounds. It grants
nothing on its own — the widening lives in Postgres, in the ``staff_read``
policies migration 007 adds, which are ``FOR SELECT`` only and whose predicate
looks the id up in ``core.staff_user`` rather than trusting the setting. A
non-staff uuid in ``app.staff_id`` reads exactly as much as no setting at all,
which is nothing.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from uuid import UUID

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.sql import text

TENANT_SETTING = "app.tenant_id"
USER_SETTING = "app.user_id"
STAFF_SETTING = "app.staff_id"


def create_engine(database_url: str) -> AsyncEngine:
    return create_async_engine(
        database_url,
        # Fail fast rather than queue forever behind an exhausted pool.
        pool_size=5,
        max_overflow=5,
        pool_timeout=10,
        # Recycle below any sensible idle timeout on a managed provider, so a
        # connection the server has already closed is never handed out.
        pool_recycle=1800,
        pool_pre_ping=True,
        echo=False,
    )


def create_session_factory(engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(engine, expire_on_commit=False, autoflush=False)


@asynccontextmanager
async def tenant_session(
    factory: async_sessionmaker[AsyncSession],
    tenant_id: UUID,
) -> AsyncIterator[AsyncSession]:
    """A session that can only see ``tenant_id``'s rows.

    ``set_config(..., TRUE)`` makes the setting **transaction-local**. That
    third argument is not a detail: with a pooled connection, a session-level
    ``SET`` outlives the request and the next tenant to be handed that
    connection inherits it. Transaction-local means the setting dies with the
    transaction, whatever the pooler does.

    The transaction is opened explicitly so the setting and the queries that
    depend on it cannot end up in different transactions.
    """
    async with factory() as session:
        async with session.begin():
            await session.execute(
                text("SELECT set_config(:key, :value, TRUE)"),
                {"key": TENANT_SETTING, "value": str(tenant_id)},
            )
            yield session


@asynccontextmanager
async def user_session(
    factory: async_sessionmaker[AsyncSession],
    user_id: UUID,
) -> AsyncIterator[AsyncSession]:
    """A session that can see one user's own rows, and no tenant's data.

    Exists for exactly one question: *which tenants does this user belong to?*
    That query cannot be tenant-scoped, because the tenant is its answer. See
    migration 003 — before it existed, this lookup silently returned nothing
    and every login concluded the user had no memberships.

    Transaction-local like `tenant_session`, for the same pooling reason. It
    sets no tenant, so every tenant-scoped table still returns zero rows here.
    """
    async with factory() as session:
        async with session.begin():
            await session.execute(
                text("SELECT set_config(:key, :value, TRUE)"),
                {"key": USER_SETTING, "value": str(user_id)},
            )
            yield session


@asynccontextmanager
async def staff_session(
    factory: async_sessionmaker[AsyncSession],
    staff_id: UUID,
) -> AsyncIterator[AsyncSession]:
    """A session that can **read** every tenant's rows, and write none of them.

    The read half is the ``staff_read`` policies from migration 007; the write
    half is that those policies are ``FOR SELECT``, so ``tenant_isolation``
    remains the only policy governing INSERT, UPDATE and DELETE — and with no
    ``app.tenant_id`` set, it matches nothing. A staff session that tries to
    write a tenant's row does not partially succeed; it affects zero rows.

    ``app.tenant_id`` is deliberately **not** set here. Admin screens filter by
    tenant in their SQL, and that filter is a convenience for the reader, not a
    security boundary — the boundary is that there is nothing to write with.

    Transaction-local like the others, for the same pooling reason: a
    connection returned to the pool still carrying ``app.staff_id`` would hand
    cross-tenant reads to whoever got it next.
    """
    async with factory() as session:
        async with session.begin():
            await session.execute(
                text("SELECT set_config(:key, :value, TRUE)"),
                {"key": STAFF_SETTING, "value": str(staff_id)},
            )
            yield session


@asynccontextmanager
async def untenanted_session(
    factory: async_sessionmaker[AsyncSession],
) -> AsyncIterator[AsyncSession]:
    """A session with no tenant set.

    Every tenant-scoped table returns zero rows here, by policy — that is the
    fail-closed property the isolation suite asserts. Use this only for tables
    that genuinely have no tenant.
    """
    async with factory() as session:
        async with session.begin():
            yield session
