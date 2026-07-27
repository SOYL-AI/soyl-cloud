"""The provider check has to work before it can tell us anything.

Acceptance criterion 3 of M1: run `scripts/provider_check.py` against the local
Docker Postgres, which supports roles and RLS by construction, so that a
failure against Neon or Supabase means *the provider* failed rather than the
script being wrong.

Running it here rather than only by hand means it cannot rot between provider
evaluations.
"""

from __future__ import annotations

import scripts.provider_check as provider_check
from tests.conftest import ApiTestSettings


async def test_provider_check_passes_against_local_postgres(settings: ApiTestSettings) -> None:
    results = await provider_check.run(_admin_dsn(settings))

    assert not results.failed, "\n".join(
        f"{criterion}: {detail}" for criterion, detail in results.failed
    )
    # A check that silently stopped asserting anything would also report no
    # failures, so the count is part of the assertion.
    assert len(results.passed) >= 14, f"only {len(results.passed)} criteria ran"


async def test_provider_check_leaves_nothing_behind(settings: ApiTestSettings) -> None:
    """It runs against the founder's trial instances. It must clean up after itself."""
    import asyncpg

    await provider_check.run(_admin_dsn(settings))

    connection = await asyncpg.connect(_admin_dsn(settings))
    try:
        leftover_roles = await connection.fetchval(
            "SELECT count(*) FROM pg_roles WHERE rolname LIKE 'chk\\_%'"
        )
        leftover_schemas = await connection.fetchval(
            "SELECT count(*) FROM information_schema.schemata WHERE schema_name LIKE 'chk\\_%'"
        )
    finally:
        await connection.close()

    assert leftover_roles == 0, f"{leftover_roles} check roles left behind"
    assert leftover_schemas == 0, f"{leftover_schemas} check schemas left behind"


def _admin_dsn(settings: ApiTestSettings) -> str:
    return str(settings.admin_database_url).replace("postgresql+asyncpg://", "postgresql://")
