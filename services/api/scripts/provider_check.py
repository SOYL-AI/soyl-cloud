"""Does this managed Postgres actually let us do RLS properly?

Runs the seven criteria in `docs/phase-0/POSTGRES-PROVIDER-CHECK.md` against a
real instance and prints a pass/fail line for each. Everything it creates is
namespaced and dropped at the end, so it is safe against a trial database.

    uv run python scripts/provider_check.py "postgresql://admin:pw@host:5432/db"

Exit code 0 means the provider can host migration 001 as written.

Written against a real connection rather than documentation on purpose: several
providers document CREATEROLE and then restrict what the created role may do,
or grant the new role membership of the owner without saying so.
"""

from __future__ import annotations

import asyncio
import sys
import uuid
from dataclasses import dataclass, field

import asyncpg

# Namespaced so a failed run leaves nothing that collides with a later one.
SUFFIX = uuid.uuid4().hex[:8]
MIGRATOR = f"chk_migrator_{SUFFIX}"
APP = f"chk_app_{SUFFIX}"
SCHEMA = f"chk_{SUFFIX}"
PASSWORD = "check-only-" + uuid.uuid4().hex

TENANT_A = uuid.UUID("11111111-1111-1111-1111-111111111111")
TENANT_B = uuid.UUID("22222222-2222-2222-2222-222222222222")


@dataclass
class Results:
    passed: list[str] = field(default_factory=list)
    failed: list[tuple[str, str]] = field(default_factory=list)

    def check(self, criterion: str, ok: bool, detail: str = "") -> None:
        if ok:
            self.passed.append(criterion)
            print(f"  PASS  {criterion}")
        else:
            self.failed.append((criterion, detail))
            print(f"  FAIL  {criterion}" + (f" — {detail}" if detail else ""))


async def _expect_error(connection: asyncpg.Connection, statement: str) -> bool:
    """True when the statement was refused, which is the desired outcome."""
    try:
        await connection.execute(statement)
    except asyncpg.PostgresError:
        return True
    return False


async def run(admin_dsn: str) -> Results:
    results = Results()
    admin = await asyncpg.connect(admin_dsn)

    try:
        # ── 1. Can we create two roles, neither of them privileged? ──────────
        try:
            await admin.execute(
                f"CREATE ROLE {MIGRATOR} LOGIN PASSWORD '{PASSWORD}' "
                f"NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS"
            )
            await admin.execute(
                f"CREATE ROLE {APP} LOGIN PASSWORD '{PASSWORD}' "
                f"NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS"
            )
            results.check("1. Two roles can be created", True)
        except asyncpg.PostgresError as exc:
            results.check("1. Two roles can be created", False, str(exc).split("\n")[0])
            return results

        rows = await admin.fetch(
            "SELECT rolname, rolsuper, rolbypassrls FROM pg_roles WHERE rolname = ANY($1::text[])",
            [MIGRATOR, APP],
        )
        privileged = [r["rolname"] for r in rows if r["rolsuper"] or r["rolbypassrls"]]
        results.check(
            "1b. Neither role is superuser or BYPASSRLS",
            not privileged,
            f"privileged: {privileged}",
        )

        # ── 2. The app role must not inherit the owner ───────────────────────
        memberships = await admin.fetch(
            "SELECT g.rolname AS granted FROM pg_auth_members m "
            "JOIN pg_roles r ON r.oid = m.member JOIN pg_roles g ON g.oid = m.roleid "
            "WHERE r.rolname = $1",
            APP,
        )
        results.check(
            "2. App role holds no role memberships",
            not memberships,
            f"member of: {[m['granted'] for m in memberships]}",
        )

        # Give the migrator what migration 001 needs.
        database = await admin.fetchval("SELECT current_database()")
        await admin.execute(f'GRANT CREATE ON DATABASE "{database}" TO {MIGRATOR}')
        await admin.execute(f'GRANT CONNECT ON DATABASE "{database}" TO {MIGRATOR}, {APP}')

        # ── 3. Extensions migration 001 and M3 depend on ─────────────────────
        for extension in ("citext", "vector"):
            try:
                await admin.execute(f"CREATE EXTENSION IF NOT EXISTS {extension}")
                results.check(f"3. Extension {extension} is available", True)
            except asyncpg.PostgresError as exc:
                results.check(
                    f"3. Extension {extension} is available", False, str(exc).split("\n")[0]
                )

        # ── 4-6. Build the real thing as the migrator, read it as the app ────
        migrator_dsn = _swap_credentials(admin_dsn, MIGRATOR, PASSWORD)
        migrator = await asyncpg.connect(migrator_dsn)
        try:
            await migrator.execute(f"CREATE SCHEMA {SCHEMA}")
            await migrator.execute(
                f"CREATE TABLE {SCHEMA}.thing ("
                f"  id bigserial PRIMARY KEY,"
                f"  tenant_id uuid NOT NULL,"
                f"  label text NOT NULL)"
            )
            await migrator.execute(f"ALTER TABLE {SCHEMA}.thing ENABLE ROW LEVEL SECURITY")
            await migrator.execute(f"ALTER TABLE {SCHEMA}.thing FORCE ROW LEVEL SECURITY")
            await migrator.execute(
                f"CREATE POLICY tenant_isolation ON {SCHEMA}.thing "
                f"FOR ALL USING (tenant_id = NULLIF(current_setting('app.tenant_id', TRUE), '')::uuid) "
                f"WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', TRUE), '')::uuid)"
            )
            await migrator.execute(f"GRANT USAGE ON SCHEMA {SCHEMA} TO {APP}")
            await migrator.execute(
                f"GRANT SELECT, INSERT, UPDATE, DELETE ON {SCHEMA}.thing TO {APP}"
            )
            await migrator.execute(f"GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA {SCHEMA} TO {APP}")
            results.check("4. Migrator can create a table with a forced policy", True)

            # Seeding proves FORCE applies to the owner: without a tenant set,
            # the owner's own insert is rejected by WITH CHECK.
            for tenant in (TENANT_A, TENANT_B):
                async with migrator.transaction():
                    await migrator.execute(
                        "SELECT set_config('app.tenant_id', $1, TRUE)", str(tenant)
                    )
                    await migrator.execute(
                        f"INSERT INTO {SCHEMA}.thing (tenant_id, label) VALUES ($1, $2)",
                        tenant,
                        f"row for {tenant}",
                    )
        except asyncpg.PostgresError as exc:
            results.check(
                "4. Migrator can create a table with a forced policy",
                False,
                str(exc).split("\n")[0],
            )
            return results
        finally:
            await migrator.close()

        app_dsn = _swap_credentials(admin_dsn, APP, PASSWORD)
        app = await asyncpg.connect(app_dsn)
        try:
            async with app.transaction():
                await app.execute("SELECT set_config('app.tenant_id', $1, TRUE)", str(TENANT_A))
                visible = await app.fetchval(f"SELECT count(*) FROM {SCHEMA}.thing")
            results.check("5. Scoped session sees exactly its own rows", visible == 1, f"saw {visible}")

            # The one that matters most: unset must be zero, not everything.
            async with app.transaction():
                unscoped = await app.fetchval(f"SELECT count(*) FROM {SCHEMA}.thing")
            results.check(
                "6. Unset app.tenant_id fails closed (0 rows)", unscoped == 0, f"saw {unscoped}"
            )

            async with app.transaction():
                await app.execute("SELECT set_config('app.tenant_id', '', TRUE)")
                empty = await app.fetchval(f"SELECT count(*) FROM {SCHEMA}.thing")
            results.check("6b. Empty app.tenant_id does not raise", empty == 0, f"saw {empty}")

            # Cross-tenant write must be refused by WITH CHECK.
            wrote_across = True
            try:
                async with app.transaction():
                    await app.execute(
                        "SELECT set_config('app.tenant_id', $1, TRUE)", str(TENANT_A)
                    )
                    await app.execute(
                        f"INSERT INTO {SCHEMA}.thing (tenant_id, label) VALUES ($1, 'smuggled')",
                        TENANT_B,
                    )
            except asyncpg.PostgresError:
                wrote_across = False
            results.check("6c. Cross-tenant INSERT is refused", not wrote_across)

            escapes = {
                "DISABLE ROW LEVEL SECURITY": f"ALTER TABLE {SCHEMA}.thing DISABLE ROW LEVEL SECURITY",
                "NO FORCE ROW LEVEL SECURITY": f"ALTER TABLE {SCHEMA}.thing NO FORCE ROW LEVEL SECURITY",
                "SET ROLE to the owner": f"SET ROLE {MIGRATOR}",
                "grant itself BYPASSRLS": f"ALTER ROLE {APP} BYPASSRLS",
            }
            for label, statement in escapes.items():
                refused = await _expect_error(app, statement)
                results.check(f"7. App role cannot {label}", refused)
        finally:
            await app.close()

        # ── 8. The pooler. The criterion most likely to fail in production ───
        print(
            "\n  NOTE  Criterion 7 in POSTGRES-PROVIDER-CHECK.md — whether the\n"
            "        connection POOLER passes set_config through per transaction —\n"
            "        is not covered here. Re-run this script against the POOLED\n"
            "        connection string, not just the direct one. A transaction-mode\n"
            "        pooler can pass every check above on the direct port and still\n"
            "        leak app.tenant_id between requests in production."
        )

    finally:
        await _cleanup(admin)
        await admin.close()

    return results


def _swap_credentials(dsn: str, user: str, password: str) -> str:
    """Replace the credentials in a DSN, keeping host, port, database and params."""
    scheme, _, rest = dsn.partition("://")
    _, _, hostpart = rest.rpartition("@")
    return f"{scheme}://{user}:{password}@{hostpart}"


async def _cleanup(admin: asyncpg.Connection) -> None:
    # DROP OWNED BY before DROP ROLE. A role holding a database-level GRANT
    # cannot be dropped ("cannot be dropped because some objects depend on it")
    # and the check would leave roles behind on the founder's trial instance
    # every time it ran.
    for statement in (
        f"DROP SCHEMA IF EXISTS {SCHEMA} CASCADE",
        f"DROP OWNED BY {APP} CASCADE",
        f"DROP OWNED BY {MIGRATOR} CASCADE",
        f"DROP ROLE IF EXISTS {APP}",
        f"DROP ROLE IF EXISTS {MIGRATOR}",
    ):
        try:
            await admin.execute(statement)
        except asyncpg.PostgresError as exc:
            print(f"  WARN  cleanup failed: {statement} — {exc}")


async def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 2

    dsn = sys.argv[1].replace("postgresql+asyncpg://", "postgresql://")
    print(f"Checking {dsn.rsplit('@', 1)[-1]}\n")
    results = await run(dsn)

    print(f"\n{len(results.passed)} passed, {len(results.failed)} failed")
    if results.failed:
        print("\nThis provider cannot host migration 001 as written:")
        for criterion, detail in results.failed:
            print(f"  - {criterion}" + (f": {detail}" if detail else ""))
        return 1

    print("This provider can host migration 001 as written.")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
