"""Promote or demote an internal staff member.

    uv run python scripts/grant_staff.py grant   founder@soyl.cloud "founder"
    uv run python scripts/grant_staff.py revoke  someone@soyl.cloud
    uv run python scripts/grant_staff.py list

In production the variable is already set inside the container, so it is:

    railway ssh --service api "python scripts/grant_staff.py list"

Runs as the **migrator** role, not the application. That is the whole reason
this is a script and not an admin screen: migration 007 grants `soyl_app`
`SELECT` on `core.staff_user` and nothing else, so the API physically cannot
promote anyone. Adding a "make this person staff" button would mean granting
the application the one privilege that makes every other guarantee negotiable.

Reads `SOYL_MIGRATION_DATABASE_URL` — the same variable Alembic and Railway
already use, so this works inside the deployed container with no extra
configuration. Refuses to run as `soyl_app`, which would fail at the grant
anyway but fails here with a sentence instead of a permission error.
"""

from __future__ import annotations

import asyncio
import os
import sys

import asyncpg


def _dsn() -> str:
    url = os.environ.get("SOYL_MIGRATION_DATABASE_URL") or os.environ.get(
        "SOYL_DATABASE_URL_MIGRATOR"
    )
    if not url:
        print("Set SOYL_MIGRATION_DATABASE_URL first (it is what Alembic uses).")
        raise SystemExit(2)
    # asyncpg speaks plain postgres URLs; the app's is a SQLAlchemy one.
    return url.replace("postgresql+asyncpg://", "postgresql://")


async def _grant(connection: asyncpg.Connection, email: str, reason: str | None) -> int:
    user_id = await connection.fetchval(
        "SELECT id FROM core.user_account WHERE email = $1 AND deleted_at IS NULL", email
    )
    if user_id is None:
        print(f"No account for {email}. They have to sign up first.")
        return 1

    # ON CONFLICT so re-granting un-revokes rather than erroring. Someone whose
    # access was removed and is being restored is the common case, and making
    # that an error would mean deleting the row that records the first grant.
    await connection.execute(
        """
        INSERT INTO core.staff_user (user_id, reason)
        VALUES ($1, $2)
        ON CONFLICT (user_id) DO UPDATE
            SET revoked_at = NULL, granted_at = now(), reason = EXCLUDED.reason
        """,
        user_id,
        reason,
    )
    print(f"{email} is now staff.")
    return 0


async def _revoke(connection: asyncpg.Connection, email: str) -> int:
    """Sets `revoked_at` rather than deleting.

    A deleted row cannot answer "who had access in March", which is the first
    question anyone asks after an incident.
    """
    updated = await connection.execute(
        """
        UPDATE core.staff_user s
           SET revoked_at = now()
          FROM core.user_account u
         WHERE u.id = s.user_id AND u.email = $1 AND s.revoked_at IS NULL
        """,
        email,
    )
    if updated.endswith(" 0"):
        print(f"{email} was not staff.")
        return 1
    print(f"{email} is no longer staff. Their access stops on their next request.")
    return 0


async def _list(connection: asyncpg.Connection) -> int:
    rows = await connection.fetch(
        """
        SELECT u.email, s.granted_at, s.revoked_at, s.reason
          FROM core.staff_user s
          JOIN core.user_account u ON u.id = s.user_id
         ORDER BY s.revoked_at NULLS FIRST, s.granted_at
        """
    )
    if not rows:
        print("Nobody is staff.")
        return 0
    for row in rows:
        state = "revoked " + row["revoked_at"].date().isoformat() if row["revoked_at"] else "active"
        print(f"{row['email']:<40} {state:<20} {row['reason'] or ''}")
    return 0


async def main(argv: list[str]) -> int:
    if not argv or argv[0] not in {"grant", "revoke", "list"}:
        print(__doc__)
        return 2

    dsn = _dsn()
    if "://soyl_app" in dsn or "://soyl_app:" in dsn:
        print("That URL connects as soyl_app, which cannot write core.staff_user by design.")
        return 2

    connection = await asyncpg.connect(dsn)
    try:
        if argv[0] == "list":
            return await _list(connection)
        if len(argv) < 2:
            print(__doc__)
            return 2
        if argv[0] == "grant":
            return await _grant(connection, argv[1], argv[2] if len(argv) > 2 else None)
        return await _revoke(connection, argv[1])
    finally:
        await connection.close()


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main(sys.argv[1:])))
