"""Test fixtures.

Two engines, deliberately:

``app_factory``       connects as ``soyl_app`` — no BYPASSRLS, owns nothing.
                      This is what the isolation suite tests through, because
                      it is what production runs as.
``migrator_factory``  connects as ``soyl_migrator``. Used to seed, to truncate,
                      and to assert on the schema itself.

Nothing here skips. If the database is unreachable the suite errors, loudly,
because a tenant isolation suite that quietly skips is worse than none at all
(`UPDATE.md` §6.2).
"""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator
from dataclasses import dataclass

import pytest
from pydantic import PostgresDsn, RedisDsn
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker
from sqlalchemy.sql import text

from soyl.infrastructure.db.session import create_engine, create_session_factory, tenant_session


class ApiTestSettings(BaseSettings):
    """Named so pytest does not try to collect it as a test class."""

    model_config = SettingsConfigDict(
        env_prefix="SOYL_", env_file=(".env", ".env.migrations"), extra="ignore"
    )

    database_url: PostgresDsn
    migration_database_url: PostgresDsn
    # Read, not assumed. Locally this is 6380 (the stack avoids the default
    # port); in CI it is 6379. A test that hardcodes either one passes in one
    # place and fails in the other.
    redis_url: RedisDsn
    # The provider check creates and drops roles, so it needs the instance's
    # admin credential. Required, not optional: acceptance criterion 3 says the
    # check runs green locally, and a skipped check proves nothing.
    admin_database_url: PostgresDsn


@pytest.fixture(scope="session")
def settings() -> ApiTestSettings:
    return ApiTestSettings()  # type: ignore[call-arg]


@pytest.fixture(scope="session")
async def app_engine(settings: ApiTestSettings) -> AsyncIterator[AsyncEngine]:
    engine = create_engine(str(settings.database_url))
    yield engine
    await engine.dispose()


@pytest.fixture(scope="session")
async def migrator_engine(settings: ApiTestSettings) -> AsyncIterator[AsyncEngine]:
    engine = create_engine(str(settings.migration_database_url))
    yield engine
    await engine.dispose()


@pytest.fixture
def app_factory(app_engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    return create_session_factory(app_engine)


@pytest.fixture
def migrator_factory(migrator_engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    return create_session_factory(migrator_engine)


@dataclass(frozen=True, slots=True)
class SeededTenant:
    tenant_id: uuid.UUID
    property_id: uuid.UUID
    user_id: uuid.UUID
    membership_id: uuid.UUID
    name: str


@dataclass(frozen=True, slots=True)
class TwoTenants:
    a: SeededTenant
    b: SeededTenant


@pytest.fixture
async def two_tenants(migrator_engine: AsyncEngine) -> AsyncIterator[TwoTenants]:
    """Two fully populated tenants that know nothing about each other.

    Seeded through the *migrator*, but still one tenant context at a time —
    FORCE ROW LEVEL SECURITY applies to the owner too, so even seeding cannot
    write a row into the wrong tenant. That is itself the first proof that
    FORCE is doing something.

    TRUNCATE rather than DELETE for cleanup: TRUNCATE is not subject to RLS,
    DELETE is, and a cleanup that silently deletes nothing leaves the next test
    reading another test's rows.
    """
    factory = create_session_factory(migrator_engine)
    await _truncate(factory)

    a = await _seed(factory, "Tenant A", "tenant-a")
    b = await _seed(factory, "Tenant B", "tenant-b")

    yield TwoTenants(a=a, b=b)

    await _truncate(factory)


async def _truncate(factory: async_sessionmaker[AsyncSession]) -> None:
    async with factory() as session:
        async with session.begin():
            await session.execute(
                text(
                    "TRUNCATE core.membership_property, core.membership, core.property, "
                    "core.tenant, core.user_account, public.lead RESTART IDENTITY CASCADE"
                )
            )


async def _seed(
    factory: async_sessionmaker[AsyncSession], name: str, slug: str
) -> SeededTenant:
    tenant_id = uuid.uuid4()
    user_id = uuid.uuid4()

    # user_account is not tenant-scoped, so it is written outside a tenant
    # context. Everything else is written inside one.
    async with factory() as session:
        async with session.begin():
            await session.execute(
                text(
                    "INSERT INTO core.user_account (id, email, display_name) "
                    "VALUES (:id, :email, :name)"
                ),
                {"id": user_id, "email": f"{slug}@example.test", "name": f"{name} Owner"},
            )

    async with tenant_session(factory, tenant_id) as session:
        # The tenant row can only be inserted by a session already scoped to
        # its own id — core.tenant's policy keys on `id`. Which means nobody
        # can create a tenant row on another tenant's behalf.
        await session.execute(
            text(
                "INSERT INTO core.tenant (id, name, slug, country) "
                "VALUES (:id, :name, :slug, 'IN')"
            ),
            {"id": tenant_id, "name": name, "slug": slug},
        )
        property_id = uuid.uuid4()
        await session.execute(
            text(
                "INSERT INTO core.property (id, tenant_id, name, rooms_total) "
                "VALUES (:id, :tenant_id, :name, 84)"
            ),
            {"id": property_id, "tenant_id": tenant_id, "name": f"{name} Hotel"},
        )
        membership_id = uuid.uuid4()
        await session.execute(
            text(
                "INSERT INTO core.membership (id, tenant_id, user_id, role, property_scope) "
                "VALUES (:id, :tenant_id, :user_id, 'owner', 'selected')"
            ),
            {"id": membership_id, "tenant_id": tenant_id, "user_id": user_id},
        )
        await session.execute(
            text(
                "INSERT INTO core.membership_property (membership_id, property_id, tenant_id) "
                "VALUES (:membership_id, :property_id, :tenant_id)"
            ),
            {"membership_id": membership_id, "property_id": property_id, "tenant_id": tenant_id},
        )

    return SeededTenant(
        tenant_id=tenant_id,
        property_id=property_id,
        user_id=user_id,
        membership_id=membership_id,
        name=name,
    )
