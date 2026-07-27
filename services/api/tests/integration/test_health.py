"""/health tells the truth about its dependencies.

Acceptance criterion 4 of M1. The dependency-down case is proved by pointing
the app at a port nothing is listening on, which is the same code path a
stopped Postgres takes — and, unlike stopping the container, it does not
require the rest of the suite to wait for it to come back. The
container-actually-stopped case is verified by hand and recorded in the M1
report.
"""

from __future__ import annotations

from collections.abc import AsyncIterator

import pytest
from httpx import ASGITransport, AsyncClient

from soyl.main import create_app
from soyl.settings import Settings
from tests.conftest import ApiTestSettings


def _settings(test_settings: ApiTestSettings, **overrides: object) -> Settings:
    values: dict[str, object] = {
        "environment": "local",
        "database_url": str(test_settings.database_url),
        "redis_url": str(test_settings.redis_url),
        "lead_ingest_token": "a" * 32,
    }
    values.update(overrides)
    return Settings(**values)  # type: ignore[arg-type]


async def _client(settings: Settings) -> AsyncIterator[AsyncClient]:
    app = create_app(settings)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Enter the lifespan so the engine and Redis client exist.
        async with app.router.lifespan_context(app):
            yield client


async def test_health_is_healthy_when_dependencies_are_up(
    settings: ApiTestSettings,
) -> None:
    async for client in _client(_settings(settings)):
        response = await client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "healthy"
    assert {d["name"] for d in body["dependencies"]} == {"postgres", "redis"}
    assert all(d["healthy"] for d in body["dependencies"])


async def test_health_reports_unhealthy_when_postgres_is_unreachable(
    settings: ApiTestSettings,
) -> None:
    """The whole point of the endpoint.

    A 200 from a process that cannot reach its database keeps the load balancer
    sending it traffic.
    """
    dead = "postgresql+asyncpg://soyl_app:soyl_app_local@localhost:1/soyl"

    async for client in _client(_settings(settings, database_url=dead)):
        response = await client.get("/health")

    assert response.status_code == 503
    body = response.json()
    assert body["status"] == "unhealthy"
    postgres = next(d for d in body["dependencies"] if d["name"] == "postgres")
    assert postgres["healthy"] is False
    assert "error" in postgres


async def test_health_reports_unhealthy_when_redis_is_unreachable(
    settings: ApiTestSettings,
) -> None:
    async for client in _client(_settings(settings, redis_url="redis://localhost:1/0")):
        response = await client.get("/health")

    assert response.status_code == 503
    redis = next(d for d in response.json()["dependencies"] if d["name"] == "redis")
    assert redis["healthy"] is False


async def test_health_never_leaks_the_connection_string(
    settings: ApiTestSettings,
) -> None:
    """Driver errors carry the DSN, password included.

    /health is usually the least authenticated thing a service exposes, so the
    error field is the exception type and nothing else.
    """
    dead = "postgresql+asyncpg://soyl_app:soyl_app_local@localhost:1/soyl"

    async for client in _client(_settings(settings, database_url=dead)):
        response = await client.get("/health")

    assert "soyl_app_local" not in response.text
    assert "localhost" not in response.text


async def test_live_does_not_touch_dependencies(settings: ApiTestSettings) -> None:
    """Liveness stays up when a dependency is down.

    Otherwise a database blip becomes a restart loop, which turns a two-minute
    outage into a much longer one.
    """
    dead = "postgresql+asyncpg://soyl_app:soyl_app_local@localhost:1/soyl"

    async for client in _client(_settings(settings, database_url=dead)):
        response = await client.get("/live")

    assert response.status_code == 200
    assert response.json() == {"status": "alive"}


@pytest.mark.parametrize("environment", ["staging", "prod"])
async def test_docs_are_closed_outside_development(
    settings: ApiTestSettings, environment: str
) -> None:
    app = create_app(
        Settings(  # type: ignore[arg-type]
            environment=environment,
            database_url="postgresql+asyncpg://soyl_app:pw@db.example.com:5432/soyl",
            redis_url="redis://cache.example.com:6379/0",
            lead_ingest_token="b" * 32,
            web_base_url="https://www.soyl.cloud",
            resend_api_key="re_not_a_real_key",
            email_from="SOYL <notifications@soyl.cloud>",
        )
    )

    assert app.docs_url is None
    assert app.openapi_url is None
