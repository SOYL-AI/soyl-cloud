"""Dependency health checks.

A ``/health`` that returns ``{"ok": true}`` unconditionally is worse than no
health check: it tells the platform to keep routing traffic to a process that
cannot serve it. These actually execute against Postgres and Redis, under a
timeout, and report which dependency failed and how long it took.
"""

from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass

from redis.asyncio import Redis
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncEngine
from sqlalchemy.sql import text


@dataclass(frozen=True, slots=True)
class DependencyHealth:
    name: str
    healthy: bool
    latency_ms: float
    error: str | None = None


# ASYNC109 would have the caller wrap these in asyncio.timeout instead. Here the
# timeout is part of what a health check *is* — a bounded probe — and it comes
# from Settings, so keeping it in the signature keeps it configurable.
async def check_postgres(engine: AsyncEngine, timeout: float) -> DependencyHealth:  # noqa: ASYNC109
    started = time.perf_counter()
    try:
        async with asyncio.timeout(timeout):
            async with engine.connect() as connection:
                # SELECT 1 proves the pool handed out a live connection and the
                # server answered. It does not prove the schema is migrated —
                # that is a deploy concern, not a liveness one.
                await connection.execute(text("SELECT 1"))
    except TimeoutError:
        return DependencyHealth("postgres", False, _elapsed(started), f"timed out after {timeout}s")
    except (SQLAlchemyError, OSError) as exc:
        return DependencyHealth("postgres", False, _elapsed(started), _summarise(exc))
    return DependencyHealth("postgres", True, _elapsed(started))


async def check_redis(redis: Redis, timeout: float) -> DependencyHealth:  # noqa: ASYNC109
    started = time.perf_counter()
    try:
        async with asyncio.timeout(timeout):
            await redis.ping()
    except TimeoutError:
        return DependencyHealth("redis", False, _elapsed(started), f"timed out after {timeout}s")
    except Exception as exc:  # redis-py raises a wide family of connection errors
        return DependencyHealth("redis", False, _elapsed(started), _summarise(exc))
    return DependencyHealth("redis", True, _elapsed(started))


def _elapsed(started: float) -> float:
    return round((time.perf_counter() - started) * 1000, 2)


def _summarise(exc: BaseException) -> str:
    """Enough to diagnose, not enough to leak a connection string.

    Driver errors routinely carry the full DSN, password included, and a health
    endpoint is usually the least authenticated thing a service exposes.
    """
    return type(exc).__name__
