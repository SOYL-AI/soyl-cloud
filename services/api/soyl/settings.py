"""Configuration, validated once at startup.

Per `docs/architecture/10-security-devops.md` §62.1. The rules that matter:

- ``extra="forbid"`` — ``SOYL_DATABSE_URL`` crashes the process instead of
  silently falling back to a default.
- ``frozen=True`` — configuration is read once into an immutable object. A
  grep for ``os.environ`` outside this module should return nothing.
- No secret has a default. A default-valued secret is a secret that ships.
- ``production_invariants`` encodes the mistakes we already know we would make.
"""

from __future__ import annotations

import os
from functools import lru_cache
from typing import Literal

from pydantic import Field, PostgresDsn, RedisDsn, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

Environment = Literal["local", "preview", "staging", "prod"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="SOYL_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="forbid",
        frozen=True,
    )

    environment: Environment

    # The application connection. Must be soyl_app — a role without BYPASSRLS —
    # or row-level security is decoration. `production_invariants` checks it.
    database_url: PostgresDsn
    redis_url: RedisDsn

    # Shared secret the web app presents on POST /v1/leads. The lead endpoint
    # is the one route that is reachable before any user exists, so it cannot
    # be protected by a session.
    lead_ingest_token: str = Field(min_length=32)

    # How long /health waits on a dependency before calling it unhealthy. A
    # health check that can hang forever takes the load balancer with it.
    health_timeout_seconds: float = 2.0

    @model_validator(mode="after")
    def production_invariants(self) -> Settings:
        if self.environment not in ("staging", "prod"):
            return self

        # PostgresDsn is a MultiHostUrl — it supports failover host lists, so
        # there is no `.host`/`.username`, only `.hosts()`. Phase 0 uses a
        # single host; checking all of them costs nothing and is correct if we
        # ever add a replica.
        hosts = self.database_url.hosts()

        for entry in hosts:
            host = entry.get("host") or ""
            if host in ("localhost", "127.0.0.1", "::1"):
                raise ValueError(f"{self.environment} database_url points at {host}")

        # The single most expensive mistake available to us: deploying with the
        # migration credential as the application credential. soyl_migrator owns
        # every table, and an owner is only subject to its own policies while
        # FORCE stays on — which a migration is allowed to toggle.
        users = {(entry.get("username") or "").lower() for entry in hosts}
        if users != {"soyl_app"}:
            raise ValueError(
                f"{self.environment} must connect as soyl_app, not {sorted(users)}. "
                "The application role must not own the tables it reads."
            )

        if self.database_url.scheme != "postgresql+asyncpg":
            raise ValueError("database_url must use the postgresql+asyncpg driver")

        return self


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Cached so the process holds exactly one Settings instance.

    Fails loudly at import/startup rather than at 3am on a code path nobody
    has exercised. ``pydantic-settings`` reads ``os.environ`` here and nowhere
    else in the codebase.
    """
    return Settings()  # type: ignore[call-arg]  # values come from the environment


def running_under_pytest() -> bool:
    """True inside a test run.

    Used only to decide whether a missing configuration should abort startup or
    be left to the test to provide. Nothing in the application changes behaviour
    based on this.
    """
    return "PYTEST_CURRENT_TEST" in os.environ
