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

from pydantic import Field, HttpUrl, PostgresDsn, RedisDsn, model_validator
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

    # Where the web app lives. Verification and reset links are built from it,
    # so a wrong value sends people to a dead host — hence the production
    # invariant below rather than a default that would quietly ship.
    web_base_url: HttpUrl = HttpUrl("http://localhost:3000")

    # Transactional email for verification and reset. Absent is valid in local
    # development: signup still creates the account and logs the link.
    # Deliberately a *different* key from the web app's, so revoking one does
    # not take out the other.
    resend_api_key: str | None = None
    email_from: str | None = None

    # Object storage. MinIO locally, R2 or equivalent in production. Reached
    # only through soyl/infrastructure/storage/ (UPDATE.md §5).
    storage_endpoint_url: HttpUrl | None = None
    storage_region: str = "us-east-1"
    storage_bucket: str = "soyl-documents"
    storage_access_key: str = ""
    storage_secret_key: str = ""

    # Azure OpenAI (AI Foundry). Absent means the deterministic fake provider
    # is used, which is correct for local development and CI: the whole
    # ingestion pipeline runs without a key, a network or a bill. Production
    # refuses to boot without it — see the invariant below.
    azure_openai_endpoint: HttpUrl | None = None
    azure_openai_api_key: str | None = None
    # What you named it in Foundry, which is not the model name.
    azure_openai_embedding_deployment: str = "text-embedding-3-small"
    # What is behind the deployment. Stored beside every vector so a model
    # change can be rolled forward document by document.
    azure_openai_embedding_model: str = "text-embedding-3-small"
    azure_openai_api_version: str = "2024-10-21"
    embedding_dimensions: int = 1536
    # The cheap model that writes hypothetical questions at ingest (§43.2).
    # Absent selects the deterministic fake, and question generation is
    # optional by design — a document without them is a slightly worse
    # retrieval target, not a missing one.
    azure_openai_chat_deployment: str = "gpt-5.4-mini"
    azure_openai_chat_model: str = "gpt-5.4-mini-2026-03-17"
    # Per chunk. The handbook says 2-4; three is the middle and the cost is
    # linear in this number.
    questions_per_chunk: int = 3

    # How long claims stay cached in Redis before being reloaded. Revocation
    # does not wait for this — bumping a user's version counter invalidates
    # them immediately (handbook §23.1).
    claims_cache_seconds: int = 300

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

        # Checked before the scheme: a localhost URL is the more specific
        # mistake and its message is the more useful one, so it should be the
        # error that surfaces when both apply. A verification link pointing at
        # localhost is a signup funnel that silently ends.
        if (self.web_base_url.host or "") in ("localhost", "127.0.0.1"):
            raise ValueError(f"{self.environment} web_base_url points at localhost")

        if self.web_base_url.scheme != "https":
            raise ValueError(f"{self.environment} web_base_url must be https")

        if not (self.azure_openai_endpoint and self.azure_openai_api_key):
            raise ValueError(
                f"{self.environment} requires SOYL_AZURE_OPENAI_ENDPOINT and "
                "SOYL_AZURE_OPENAI_API_KEY — the fake embedding provider produces "
                "vectors that are not semantic and must never reach a real corpus"
            )

        if not (self.storage_access_key and self.storage_secret_key):
            raise ValueError(
                f"{self.environment} requires SOYL_STORAGE_ACCESS_KEY and "
                "SOYL_STORAGE_SECRET_KEY — documents cannot be stored without them"
            )

        if not (self.resend_api_key and self.email_from):
            raise ValueError(
                f"{self.environment} requires SOYL_RESEND_API_KEY and SOYL_EMAIL_FROM — "
                "signup cannot verify an address without them"
            )

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
