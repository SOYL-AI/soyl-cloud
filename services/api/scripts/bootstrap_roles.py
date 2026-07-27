"""Apply the extension and role SQL to a database that is not the local one.

Docker runs `docker/postgres/*.sql` automatically on an empty data directory.
A managed provider does not, so staging and production need the same two files
applied by hand — once, before the first migration.

    uv run python scripts/bootstrap_roles.py "postgresql://admin:pw@host:5432/db"

Runs the *same files* the local stack uses. If these ever diverge, the tenant
isolation suite passes locally and the deployed database is a different shape,
which is the worst version of this failure.

Idempotent enough to re-run: role creation is skipped when the role exists.
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

import asyncpg


def _sql_dir() -> Path:
    """Find docker/postgres from a checkout or from inside the image.

    In the repo it is three levels up from this file; in the container the
    Dockerfile copies it to /app/docker/postgres. Checking both means the same
    script works in both places rather than only the one it was written in.
    """
    here = Path(__file__).resolve()
    for candidate in (here.parents[3] / "docker" / "postgres", here.parents[1] / "docker" / "postgres"):
        if candidate.is_dir():
            return candidate
    raise FileNotFoundError("docker/postgres not found")


SQL_DIR = _sql_dir()


async def bootstrap(dsn: str) -> int:
    files = sorted(SQL_DIR.glob("*.sql"))
    if not files:
        print(f"No SQL found in {SQL_DIR}")
        return 1

    connection = await asyncpg.connect(dsn)
    try:
        for path in files:
            # ASCII only: this runs on Windows consoles using cp1252, where a unicode
            # arrow is an unhandled exception rather than a cosmetic problem.
            print(f"applying {path.name}")
            try:
                await connection.execute(path.read_text(encoding="utf-8"))
            except asyncpg.DuplicateObjectError:
                # A role already exists. Re-running is a normal thing to do
                # when a deploy is retried, so this is not a failure.
                print("  already applied, skipped")
            except asyncpg.PostgresError as exc:
                print(f"  FAILED: {exc}")
                return 1

        roles = await connection.fetch(
            "SELECT rolname, rolsuper, rolbypassrls FROM pg_roles "
            "WHERE rolname IN ('soyl_migrator', 'soyl_app') ORDER BY rolname"
        )
        print()
        for role in roles:
            print(
                f"  {role['rolname']:<14} superuser={role['rolsuper']}  "
                f"bypassrls={role['rolbypassrls']}"
            )

        if len(roles) != 2:
            print("\nExpected both roles to exist.")
            return 1
        if any(role["rolsuper"] or role["rolbypassrls"] for role in roles):
            print("\nA role has superuser or BYPASSRLS. RLS would be decoration.")
            return 1
    finally:
        await connection.close()

    print("\nReady for `alembic upgrade head`.")
    return 0


async def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 2
    return await bootstrap(sys.argv[1].replace("postgresql+asyncpg://", "postgresql://"))


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
