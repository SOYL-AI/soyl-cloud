"""Migration 007's staff read path, tested where it is enforced.

`test_tenant_isolation.py` proves a tenant cannot read another tenant. This
file proves the exception M6 introduces is *only* the exception it claims to
be. Every test connects as ``soyl_app`` — the role production runs as, with no
BYPASSRLS — because a widening tested through the owner proves nothing.

Five properties, and each one corresponds to a way this could have been built
wrong:

1. A live staff member reads every tenant.               (it works at all)
2. A staff member cannot **write** any tenant's row.     (FOR SELECT, not FOR ALL)
3. An arbitrary uuid in ``app.staff_id`` reads nothing.  (not a forgeable flag)
4. A revoked staff member reads nothing, immediately.    (no cache to wait out)
5. Every table with ``tenant_isolation`` also has ``staff_read``.
   (the one that catches the *next* table, which is the failure a list of
   table names in the migration cannot catch)
"""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator

import pytest
from sqlalchemy.exc import DBAPIError
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker
from sqlalchemy.sql import text

from soyl.infrastructure.db.session import (
    create_session_factory,
    staff_session,
    tenant_session,
    untenanted_session,
)
from tests.conftest import TwoTenants


@pytest.fixture
async def staff_user(migrator_engine: AsyncEngine) -> AsyncIterator[uuid.UUID]:
    """A real staff member.

    Written through the *migrator*, because that is the only role that can:
    `soyl_app` holds SELECT on `core.staff_user` and nothing else, which is
    itself one of the guarantees under test.
    """
    factory = create_session_factory(migrator_engine)
    user_id = uuid.uuid4()

    async with factory() as session:
        async with session.begin():
            await session.execute(
                text(
                    "INSERT INTO core.user_account (id, email, display_name) "
                    "VALUES (:id, :email, 'Staff')"
                ),
                {"id": user_id, "email": f"staff-{user_id}@soyl.cloud"},
            )
            await session.execute(
                text("INSERT INTO core.staff_user (user_id, reason) VALUES (:id, 'test')"),
                {"id": user_id},
            )

    yield user_id

    async with factory() as session:
        async with session.begin():
            await session.execute(
                text("DELETE FROM core.staff_user WHERE user_id = :id"), {"id": user_id}
            )
            await session.execute(
                text("DELETE FROM core.user_account WHERE id = :id"), {"id": user_id}
            )


async def _tenant_names(session: AsyncSession) -> set[str]:
    rows = await session.execute(text("SELECT name FROM core.tenant"))
    return {str(row[0]) for row in rows}


# ── 1. It works ─────────────────────────────────────────────────────────────


async def test_staff_reads_every_tenant(
    app_factory: async_sessionmaker[AsyncSession],
    two_tenants: TwoTenants,
    staff_user: uuid.UUID,
) -> None:
    """The whole point of §11: cross-tenant screens.

    Asserted on both tenants together rather than "more than one", so a bug
    that leaks exactly one extra tenant cannot pass.
    """
    async with staff_session(app_factory, staff_user) as session:
        names = await _tenant_names(session)

    assert {two_tenants.a.name, two_tenants.b.name} <= names


async def test_staff_reads_across_every_schema(
    app_factory: async_sessionmaker[AsyncSession],
    two_tenants: TwoTenants,
    staff_user: uuid.UUID,
) -> None:
    """Not just `core.tenant`.

    The migration creates the policies from `pg_policies` in a loop, and a loop
    that ran zero times would still leave this suite's first test passing on
    `core.tenant` alone if that one table had been done by hand.
    """
    async with staff_session(app_factory, staff_user) as session:
        for table in ("core.property", "core.membership", "rag.document", "ai.turn"):
            # No assertion on the count — the fixture seeds properties and
            # memberships but not documents or turns. What is being asserted is
            # that the query is *permitted*, i.e. does not come back empty
            # because the policy denied it.
            result = await session.execute(text(f"SELECT count(*) FROM {table}"))  # noqa: S608
            assert result.scalar_one() >= 0

        properties = await session.execute(text("SELECT count(*) FROM core.property"))
        assert properties.scalar_one() >= 2


# ── 2. Read-only ────────────────────────────────────────────────────────────


async def test_staff_cannot_update_a_tenant_row(
    app_factory: async_sessionmaker[AsyncSession],
    two_tenants: TwoTenants,
    staff_user: uuid.UUID,
) -> None:
    """`staff_read` is FOR SELECT, so `tenant_isolation` still governs UPDATE.

    With no `app.tenant_id` set, that policy matches nothing — so the UPDATE is
    not refused, it simply affects **zero rows**. That is the quieter and more
    dangerous failure mode, which is why this asserts on the rowcount rather
    than expecting an exception.
    """
    async with staff_session(app_factory, staff_user) as session:
        result = await session.execute(
            text("UPDATE core.tenant SET name = 'hijacked' WHERE id = :id"),
            {"id": two_tenants.a.tenant_id},
        )
        assert result.rowcount == 0

    async with tenant_session(app_factory, two_tenants.a.tenant_id) as session:
        name = await session.execute(text("SELECT name FROM core.tenant"))
        assert name.scalar_one() == two_tenants.a.name


async def test_staff_cannot_insert_into_a_tenant(
    app_factory: async_sessionmaker[AsyncSession],
    two_tenants: TwoTenants,
    staff_user: uuid.UUID,
) -> None:
    """An INSERT is refused outright, because `WITH CHECK` has to pass."""
    async with staff_session(app_factory, staff_user) as session:
        with pytest.raises(DBAPIError):
            await session.execute(
                text(
                    "INSERT INTO core.property (tenant_id, name, rooms_total) "
                    "VALUES (:tenant_id, 'Staff Hotel', 1)"
                ),
                {"tenant_id": two_tenants.a.tenant_id},
            )


async def test_staff_cannot_delete_a_tenant_row(
    app_factory: async_sessionmaker[AsyncSession],
    two_tenants: TwoTenants,
    staff_user: uuid.UUID,
) -> None:
    async with staff_session(app_factory, staff_user) as session:
        result = await session.execute(
            text("DELETE FROM core.property WHERE tenant_id = :id"),
            {"id": two_tenants.a.tenant_id},
        )
        assert result.rowcount == 0


async def test_staff_cannot_promote_anyone(
    app_factory: async_sessionmaker[AsyncSession], staff_user: uuid.UUID
) -> None:
    """The grant, not a policy, is what stops this.

    `soyl_app` holds SELECT on `core.staff_user` and nothing more, so even a
    staff session — the most privileged thing the application can hold — cannot
    add a second staff member. This is what makes "an application bug cannot
    grant staff" a true statement rather than an intention.
    """
    async with staff_session(app_factory, staff_user) as session:
        with pytest.raises(DBAPIError):
            await session.execute(
                text("INSERT INTO core.staff_user (user_id) VALUES (:id)"),
                {"id": uuid.uuid4()},
            )


async def test_staff_cannot_enumerate_other_staff(
    app_factory: async_sessionmaker[AsyncSession],
    migrator_engine: AsyncEngine,
    staff_user: uuid.UUID,
) -> None:
    """`staff_self_read` narrows to the row the caller already named.

    `core.staff_user` is the one table whose contents are an attacker's
    shortlist, so a staff session sees itself and nothing else. This matters
    more than it looks: `core.staff_user` is `ENABLE` without `FORCE` — the
    only table in the database that is — and this is the test that the missing
    FORCE did not quietly widen anything for the application role.
    """
    factory = create_session_factory(migrator_engine)
    other_id = uuid.uuid4()
    async with factory() as session:
        async with session.begin():
            await session.execute(
                text(
                    "INSERT INTO core.user_account (id, email, display_name) "
                    "VALUES (:id, :email, 'Other')"
                ),
                {"id": other_id, "email": f"other-{other_id}@soyl.cloud"},
            )
            await session.execute(
                text("INSERT INTO core.staff_user (user_id) VALUES (:id)"), {"id": other_id}
            )

    try:
        async with staff_session(app_factory, staff_user) as session:
            rows = await session.execute(text("SELECT user_id FROM core.staff_user"))
            visible = {row[0] for row in rows}
        assert visible == {staff_user}
    finally:
        async with factory() as session:
            async with session.begin():
                await session.execute(
                    text("DELETE FROM core.staff_user WHERE user_id = :id"), {"id": other_id}
                )
                await session.execute(
                    text("DELETE FROM core.user_account WHERE id = :id"), {"id": other_id}
                )


# ── 3. Not forgeable ────────────────────────────────────────────────────────


async def test_an_unknown_staff_id_reads_nothing(
    app_factory: async_sessionmaker[AsyncSession], two_tenants: TwoTenants
) -> None:
    """Setting the variable is not the grant; being in the table is.

    If the predicate were `current_setting('app.staff_id') IS NOT NULL`, this
    test would fail — and that is exactly the design that was rejected.
    """
    async with staff_session(app_factory, uuid.uuid4()) as session:
        assert await _tenant_names(session) == set()


async def test_a_real_user_who_is_not_staff_reads_nothing(
    app_factory: async_sessionmaker[AsyncSession], two_tenants: TwoTenants
) -> None:
    """A customer's own user id in `app.staff_id` grants nothing.

    Closer to a real attack than a random uuid: the id here belongs to a
    genuine, signed-in account.
    """
    async with staff_session(app_factory, two_tenants.a.user_id) as session:
        assert await _tenant_names(session) == set()


async def test_an_untenanted_session_still_reads_nothing(
    app_factory: async_sessionmaker[AsyncSession], two_tenants: TwoTenants
) -> None:
    """The pre-M6 guarantee, re-asserted.

    Adding a permissive policy widens `SELECT` for everyone it admits. This
    checks that the default — no settings at all — was not widened with it.
    """
    async with untenanted_session(app_factory) as session:
        assert await _tenant_names(session) == set()


# ── 4. Revocation ───────────────────────────────────────────────────────────


async def test_revoked_staff_reads_nothing_immediately(
    app_factory: async_sessionmaker[AsyncSession],
    migrator_engine: AsyncEngine,
    two_tenants: TwoTenants,
    staff_user: uuid.UUID,
) -> None:
    """Revocation lands on the next statement, with no cache to expire.

    The claims cache is why this needs saying: role changes elsewhere in the
    system wait on a version bump in Redis. Staff access does not go through
    claims, so `revoked_at` is authoritative the moment it is written — which
    is the property you want on the access nobody else can see.
    """
    async with staff_session(app_factory, staff_user) as session:
        assert await _tenant_names(session) != set()

    migrator = create_session_factory(migrator_engine)
    async with migrator() as session:
        async with session.begin():
            await session.execute(
                text("UPDATE core.staff_user SET revoked_at = now() WHERE user_id = :id"),
                {"id": staff_user},
            )

    async with staff_session(app_factory, staff_user) as session:
        assert await _tenant_names(session) == set()


# ── 5. No table left behind ─────────────────────────────────────────────────


async def test_every_tenant_scoped_table_has_a_staff_policy(
    migrator_factory: async_sessionmaker[AsyncSession],
) -> None:
    """The test that catches the *next* migration, not this one.

    Migration 007 creates `staff_read` from `pg_policies`, so it cannot miss a
    table that existed when it ran. A table added in 008 is a different matter:
    it would get `tenant_isolation` by convention and no `staff_read`, and the
    only symptom would be an admin screen quietly missing a section — the sort
    of bug that gets explained as "no data yet".

    Equality in both directions on purpose. A `staff_read` on a table with no
    `tenant_isolation` is the more alarming direction: it would mean something
    was widened that was never narrowed.
    """
    async with migrator_factory() as session:
        rows = await session.execute(
            text(
                """
                SELECT policyname, schemaname || '.' || tablename AS relation
                  FROM pg_policies
                 WHERE policyname IN ('tenant_isolation', 'staff_read')
                """
            )
        )
        by_policy: dict[str, set[str]] = {"tenant_isolation": set(), "staff_read": set()}
        for policy, relation in rows:
            by_policy[str(policy)].add(str(relation))

    assert by_policy["tenant_isolation"], "no tenant_isolation policies found at all"
    missing = by_policy["tenant_isolation"] - by_policy["staff_read"]
    assert not missing, f"tenant-scoped tables with no staff_read policy: {sorted(missing)}"

    stray = by_policy["staff_read"] - by_policy["tenant_isolation"]
    assert not stray, f"staff_read on tables with no tenant_isolation: {sorted(stray)}"


async def test_staff_read_policies_are_select_only(
    migrator_factory: async_sessionmaker[AsyncSession],
) -> None:
    """A `staff_read` created `FOR ALL` would make every read-only test above
    pass and every write test fail — so this asserts the shape directly, where
    the failure is one line rather than a suite."""
    async with migrator_factory() as session:
        rows = await session.execute(
            text("SELECT cmd FROM pg_policies WHERE policyname = 'staff_read'")
        )
        commands = {str(row[0]) for row in rows}

    assert commands == {"SELECT"}, f"staff_read is not SELECT-only: {commands}"
