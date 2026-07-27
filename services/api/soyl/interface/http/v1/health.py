"""Liveness and readiness.

``/health`` checks the dependencies for real and returns 503 when one is down,
because a 200 from a process that cannot reach Postgres is a lie that keeps
traffic flowing to it.
"""

from __future__ import annotations

import asyncio
from typing import Annotated

from fastapi import APIRouter, Depends, Response, status
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncEngine

from soyl.infrastructure.health import check_postgres, check_redis
from soyl.interface.http.deps import get_engine, get_redis, get_settings_dep
from soyl.settings import Settings

router = APIRouter(tags=["health"])


@router.get("/health")
async def health(
    response: Response,
    engine: Annotated[AsyncEngine, Depends(get_engine)],
    redis: Annotated[Redis, Depends(get_redis)],
    settings: Annotated[Settings, Depends(get_settings_dep)],
) -> dict[str, object]:
    postgres_health, redis_health = await asyncio.gather(
        check_postgres(engine, settings.health_timeout_seconds),
        check_redis(redis, settings.health_timeout_seconds),
    )

    dependencies = [postgres_health, redis_health]
    healthy = all(dependency.healthy for dependency in dependencies)

    if not healthy:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "status": "healthy" if healthy else "unhealthy",
        "environment": settings.environment,
        "dependencies": [
            {
                "name": dependency.name,
                "healthy": dependency.healthy,
                "latency_ms": dependency.latency_ms,
                **({"error": dependency.error} if dependency.error else {}),
            }
            for dependency in dependencies
        ],
    }


@router.get("/live")
async def live() -> dict[str, str]:
    """Liveness only: is the process running.

    Separate from ``/health`` on purpose. A platform that restarts the
    container whenever a *dependency* is unavailable turns a database blip
    into a restart loop.
    """
    return {"status": "alive"}
