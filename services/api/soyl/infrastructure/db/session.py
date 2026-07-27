"""Database engine and the two ways to get a session.

The distinction here is the whole tenancy model, so it is worth being explicit:

``tenant_session``    sets ``app.tenant_id`` transaction-locally and is how
                      every tenant-scoped read and write happens.
``untenanted_session`` sets nothing, and is only for tables that have no
                      ``tenant_id`` at all — ``public.lead`` is the only one in
                      Phase 0, because a lead arrives before any tenant exists.

There is deliberately no third option. If a query needs to cross tenants, that
is a conversation, not a helper.
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
