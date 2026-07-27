"""The tenant isolation suite.

`UPDATE.md` §6.2 — the one test suite in Phase 0 that cannot be skipped. It
exists because the alternative to proving isolation is assuming it, and the
cost of being wrong is a breach rather than a bug.

Four things are proved here:

1. Tenant B, through every repository method, sees none of tenant A's rows.
2. With ``app.tenant_id`` unset, a tenant-scoped query returns **zero** rows —
   not an error, not everything. Failing closed is the property that matters,
   because an unset variable is what a bug looks like.
3. ``soyl_app`` cannot turn RLS off and cannot become the table owner.
4. Schema-wide: every table carrying a ``tenant_id`` has RLS enabled *and*
   forced. This is the one that catches the table added on a Friday without a
   policy, and it fails the moment such a table appears.
"""

from __future__ import annotations

import uuid

import pytest
from sqlalchemy.exc import DBAPIError, ProgrammingError
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker
from sqlalchemy.sql import text

from soyl.infrastructure.db.repositories.membership_repository import MembershipRepository
from soyl.infrastructure.db.repositories.property_repository import PropertyRepository
from soyl.infrastructure.db.repositories.tenant_repository import TenantRepository
from soyl.infrastructure.db.session import tenant_session, untenanted_session
from tests.conftest import TwoTenants

# Tables that legitimately have no tenant_id and no policy. Every entry needs a
# reason, and adding one should feel like a decision — the whole value of the
# schema-wide assertion is that it is hard to silence.
UNTENANTED_TABLES: dict[str, str] = {
    "public.lead": "A lead arrives before any tenant exists (DECISION-LOG.md).",
    "core.user_account": "A user may belong to several tenants; tenancy lives on membership.",
    "core.session": "Resolved from a cookie before any tenant is known.",
    "core.credential_token": "Resolved from a link in an email before any tenant is known.",
    "core.oauth_account": "Resolved from a provider callback before any tenant is known.",
    "public.alembic_version": "Alembic's bookkeeping.",
}

# Tenant-scoped but keyed on a column other than tenant_id.
SPECIAL_POLICY_TABLES: dict[str, str] = {
    "core.tenant": "id",
}


# ── 1. Every repository method, under the wrong tenant ───────────────────────


async def test_property_get_returns_nothing_for_another_tenant(
    app_factory: async_sessionmaker[AsyncSession], two_tenants: TwoTenants
) -> None:
    async with tenant_session(app_factory, two_tenants.b.tenant_id) as session:
        assert await PropertyRepository(session).get(two_tenants.a.property_id) is None


async def test_property_list_returns_only_own_rows(
    app_factory: async_sessionmaker[AsyncSession], two_tenants: TwoTenants
) -> None:
    async with tenant_session(app_factory, two_tenants.b.tenant_id) as session:
        properties = await PropertyRepository(session).list_active()

    assert [p.id for p in properties] == [two_tenants.b.property_id]


async def test_property_count_does_not_leak_the_existence_of_other_rows(
    app_factory: async_sessionmaker[AsyncSession], two_tenants: TwoTenants
) -> None:
    # A count is a read too. Leaking "tenant A has 400 properties" is still a leak.
    async with tenant_session(app_factory, two_tenants.b.tenant_id) as session:
        assert await PropertyRepository(session).count() == 1


async def test_tenant_get_returns_nothing_for_another_tenant(
    app_factory: async_sessionmaker[AsyncSession], two_tenants: TwoTenants
) -> None:
    async with tenant_session(app_factory, two_tenants.b.tenant_id) as session:
        assert await TenantRepository(session).get(two_tenants.a.tenant_id) is None


async def test_tenant_list_sees_exactly_itself(
    app_factory: async_sessionmaker[AsyncSession], two_tenants: TwoTenants
) -> None:
    async with tenant_session(app_factory, two_tenants.b.tenant_id) as session:
        visible = await TenantRepository(session).list_visible()

    assert [t.id for t in visible] == [two_tenants.b.tenant_id]


async def test_membership_get_returns_nothing_for_another_tenant(
    app_factory: async_sessionmaker[AsyncSession], two_tenants: TwoTenants
) -> None:
    async with tenant_session(app_factory, two_tenants.b.tenant_id) as session:
        assert await MembershipRepository(session).get(two_tenants.a.membership_id) is None


async def test_membership_list_returns_only_own_rows(
    app_factory: async_sessionmaker[AsyncSession], two_tenants: TwoTenants
) -> None:
    async with tenant_session(app_factory, two_tenants.b.tenant_id) as session:
        memberships = await MembershipRepository(session).list_for_tenant()

    assert [m.id for m in memberships] == [two_tenants.b.membership_id]


async def test_membership_property_join_table_is_isolated(
    app_factory: async_sessionmaker[AsyncSession], two_tenants: TwoTenants
) -> None:
    # This is the table UPDATE.md §7 gives no tenant_id. Without the column it
    # added here, this test could not be written at all.
    async with tenant_session(app_factory, two_tenants.b.tenant_id) as session:
        links = await MembershipRepository(session).list_scoped_properties()

    assert [link.property_id for link in links] == [two_tenants.b.property_id]


# ── 2. Writes cannot cross a tenant boundary either ──────────────────────────


async def test_cannot_write_a_row_into_another_tenant(
    app_factory: async_sessionmaker[AsyncSession], two_tenants: TwoTenants
) -> None:
    """WITH CHECK, not just USING.

    A policy with only USING filters reads and lets a caller *insert* a row
    stamped with someone else's tenant_id — invisible to them afterwards, but
    present, and counted in their bills and their exports.
    """
    with pytest.raises(DBAPIError) as raised:
        async with tenant_session(app_factory, two_tenants.b.tenant_id) as session:
            await PropertyRepository(session).create(
                tenant_id=two_tenants.a.tenant_id, name="Smuggled into tenant A"
            )

    assert "row-level security" in str(raised.value).lower()


async def test_cannot_update_another_tenants_row(
    app_factory: async_sessionmaker[AsyncSession], two_tenants: TwoTenants
) -> None:
    async with tenant_session(app_factory, two_tenants.b.tenant_id) as session:
        result = await session.execute(
            text("UPDATE core.property SET name = 'renamed' WHERE id = :id"),
            {"id": two_tenants.a.property_id},
        )

    # Not an error — the row is simply not visible, so nothing matches.
    assert result.rowcount == 0


async def test_cannot_delete_another_tenants_row(
    app_factory: async_sessionmaker[AsyncSession], two_tenants: TwoTenants
) -> None:
    async with tenant_session(app_factory, two_tenants.b.tenant_id) as session:
        result = await session.execute(
            text("DELETE FROM core.property WHERE id = :id"), {"id": two_tenants.a.property_id}
        )

    assert result.rowcount == 0


# ── 3. Unset tenant fails closed ─────────────────────────────────────────────


@pytest.mark.parametrize(
    "table",
    ["core.tenant", "core.property", "core.membership", "core.membership_property"],
)
async def test_unset_tenant_returns_zero_rows(
    app_factory: async_sessionmaker[AsyncSession], two_tenants: TwoTenants, table: str
) -> None:
    """The single most important assertion in this file.

    An unset ``app.tenant_id`` is what a bug looks like: a code path that forgot
    to open a tenant session. It must return nothing. Returning everything
    would make a forgotten context a cross-tenant read, and raising would make
    it a 500 that someone silences with a try/except.
    """
    async with untenanted_session(app_factory) as session:
        result = await session.execute(text(f"SELECT count(*) FROM {table}"))
        assert result.scalar_one() == 0


async def test_an_empty_tenant_setting_is_not_a_crash(
    app_factory: async_sessionmaker[AsyncSession], two_tenants: TwoTenants
) -> None:
    """``''::uuid`` raises. NULLIF in the policy is what stops it.

    Without the guard, anything that set the variable to an empty string —
    a header that arrived blank, a config default — turns every query on
    every tenant-scoped table into a 500.
    """
    async with untenanted_session(app_factory) as session:
        await session.execute(text("SELECT set_config('app.tenant_id', '', TRUE)"))
        result = await session.execute(text("SELECT count(*) FROM core.property"))
        assert result.scalar_one() == 0


async def test_the_tenant_setting_does_not_survive_its_transaction(
    app_factory: async_sessionmaker[AsyncSession], two_tenants: TwoTenants
) -> None:
    """Transaction-local, not session-local.

    ``set_config(..., TRUE)`` is the difference between a pooled connection
    that is safe to reuse and one that hands the next request the previous
    tenant's context. Proved by using the same pooled connection twice.
    """
    async with tenant_session(app_factory, two_tenants.a.tenant_id) as session:
        assert (await session.execute(text("SELECT count(*) FROM core.property"))).scalar_one() == 1

    async with untenanted_session(app_factory) as session:
        assert (await session.execute(text("SELECT count(*) FROM core.property"))).scalar_one() == 0


# ── 4. The app role cannot escape its own policies ───────────────────────────


@pytest.mark.parametrize(
    "statement",
    [
        "ALTER TABLE core.property DISABLE ROW LEVEL SECURITY",
        "ALTER TABLE core.property NO FORCE ROW LEVEL SECURITY",
        "DROP POLICY tenant_isolation ON core.property",
        "SET ROLE soyl_migrator",
        "ALTER ROLE soyl_app BYPASSRLS",
        "CREATE TABLE core.sneaky (tenant_id uuid, secret text)",
    ],
)
async def test_app_role_cannot_escape_rls(
    app_factory: async_sessionmaker[AsyncSession], statement: str
) -> None:
    with pytest.raises((ProgrammingError, DBAPIError)):
        async with untenanted_session(app_factory) as session:
            await session.execute(text(statement))


async def test_app_role_has_neither_superuser_nor_bypassrls(
    app_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with untenanted_session(app_factory) as session:
        row = (
            await session.execute(
                text(
                    "SELECT rolsuper, rolbypassrls FROM pg_roles "
                    "WHERE rolname = current_user"
                )
            )
        ).one()

    assert row.rolsuper is False, "the application role is a superuser"
    assert row.rolbypassrls is False, "the application role can bypass RLS"


async def test_app_role_is_not_a_member_of_the_migrator(
    app_factory: async_sessionmaker[AsyncSession],
) -> None:
    """Some providers grant the created role membership of the owner.

    If that ever happens, ``SET ROLE soyl_migrator`` starts succeeding and
    every policy above becomes optional.
    """
    async with untenanted_session(app_factory) as session:
        result = await session.execute(
            text(
                "SELECT count(*) FROM pg_auth_members m "
                "JOIN pg_roles member ON member.oid = m.member "
                "JOIN pg_roles granted ON granted.oid = m.roleid "
                "WHERE member.rolname = current_user"
            )
        )

    assert result.scalar_one() == 0


# ── 5. Schema-wide: no table ships without a policy ──────────────────────────


async def test_every_tenant_scoped_table_has_rls_enabled_and_forced(
    migrator_engine: AsyncEngine,
) -> None:
    """The Friday-afternoon test.

    Any table with a ``tenant_id`` column must have RLS enabled *and* forced.
    ``ENABLE`` alone exempts the owner, which is the role migrations run as, so
    a table with ENABLE and no FORCE is protected against everyone except the
    one connection that can do the most damage.

    A new table without a policy fails this the moment it is added, which is
    the entire point — nobody has to remember.
    """
    async with migrator_engine.connect() as connection:
        rows = (
            await connection.execute(
                text(
                    """
                    SELECT n.nspname || '.' || c.relname AS qualified_name,
                           c.relrowsecurity            AS rls_enabled,
                           c.relforcerowsecurity       AS rls_forced,
                           EXISTS (
                               SELECT 1 FROM information_schema.columns col
                               WHERE col.table_schema = n.nspname
                                 AND col.table_name = c.relname
                                 AND col.column_name = 'tenant_id'
                           )                          AS has_tenant_id
                    FROM pg_class c
                    JOIN pg_namespace n ON n.oid = c.relnamespace
                    WHERE c.relkind IN ('r', 'p')
                      AND NOT c.relispartition
                      AND n.nspname IN ('core', 'public', 'audit')
                    ORDER BY 1
                    """
                )
            )
        ).all()

    assert rows, "no tables found — has migration 001 run?"

    unprotected: list[str] = []
    for row in rows:
        name = row.qualified_name
        needs_rls = row.has_tenant_id or name in SPECIAL_POLICY_TABLES

        if not needs_rls:
            assert name in UNTENANTED_TABLES, (
                f"{name} has no tenant_id and is not a declared exception. "
                f"Either add tenant_id and a policy, or add it to UNTENANTED_TABLES "
                f"with a reason."
            )
            continue

        if not (row.rls_enabled and row.rls_forced):
            unprotected.append(
                f"{name} (enabled={row.rls_enabled}, forced={row.rls_forced})"
            )

    assert not unprotected, "tenant-scoped tables without RLS enabled AND forced: " + ", ".join(
        unprotected
    )


async def test_every_protected_table_actually_has_a_policy(
    migrator_engine: AsyncEngine,
) -> None:
    """RLS with no policy denies everything, which looks like it works.

    A table with ``ENABLE`` and no policy passes the assertion above and then
    returns zero rows to everyone, including the legitimate tenant. That is a
    silent outage rather than a leak, so it is worth catching separately.
    """
    async with migrator_engine.connect() as connection:
        rows = (
            await connection.execute(
                text(
                    """
                    SELECT n.nspname || '.' || c.relname AS qualified_name,
                           count(p.polname)              AS policies
                    FROM pg_class c
                    JOIN pg_namespace n ON n.oid = c.relnamespace
                    LEFT JOIN pg_policy p ON p.polrelid = c.oid
                    WHERE c.relkind IN ('r', 'p')
                      AND n.nspname IN ('core', 'public', 'audit')
                      AND c.relrowsecurity
                      AND NOT c.relispartition
                    GROUP BY 1
                    ORDER BY 1
                    """
                )
            )
        ).all()

    assert rows, "no RLS-enabled tables found"
    without = [row.qualified_name for row in rows if row.policies == 0]
    assert not without, f"RLS enabled but no policy — denies everyone: {without}"


async def test_the_declared_exceptions_still_exist(migrator_engine: AsyncEngine) -> None:
    """Stops UNTENANTED_TABLES becoming a list of tables that no longer exist.

    A stale exception is how a real table quietly inherits a waiver written for
    something else.
    """
    async with migrator_engine.connect() as connection:
        existing = {
            row.qualified_name
            for row in (
                await connection.execute(
                    text(
                        "SELECT n.nspname || '.' || c.relname AS qualified_name "
                        "FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace "
                        "WHERE c.relkind IN ('r', 'p') AND NOT c.relispartition "
                        "AND n.nspname IN ('core', 'public', 'audit')"
                    )
                )
            ).all()
        }

    stale = set(UNTENANTED_TABLES) - existing
    assert not stale, f"declared exceptions for tables that no longer exist: {sorted(stale)}"


# ── 6. The untenanted table is genuinely reachable ───────────────────────────


async def test_leads_are_writable_without_a_tenant(
    app_factory: async_sessionmaker[AsyncSession], two_tenants: TwoTenants
) -> None:
    """The counterpart to every assertion above.

    ``public.lead`` must stay usable with no tenant context, or the contact
    form breaks. Written explicitly so that "everything returns zero rows"
    can never be mistaken for the suite passing.
    """
    lead_id = uuid.uuid4()

    async with untenanted_session(app_factory) as session:
        await session.execute(
            text(
                "INSERT INTO public.lead (id, name, email, company, message) "
                "VALUES (:id, 'Probe', 'probe@example.test', 'Probe Hotel', "
                "'A message long enough to pass the check constraint.')"
            ),
            {"id": lead_id},
        )

    async with untenanted_session(app_factory) as session:
        found = (
            await session.execute(
                text("SELECT count(*) FROM public.lead WHERE id = :id"), {"id": lead_id}
            )
        ).scalar_one()

    assert found == 1
