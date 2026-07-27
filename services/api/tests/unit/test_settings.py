"""Settings validation.

The `production_invariants` validator is the load-bearing part of §62.1 — it
encodes the mistakes we already know we would otherwise make, so each one gets
a test that proves the process refuses to start.
"""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from soyl.settings import Settings

PROD = {
    "environment": "prod",
    "database_url": "postgresql+asyncpg://soyl_app:pw@db.example.com:5432/soyl",
    "redis_url": "redis://cache.example.com:6379/0",
    "lead_ingest_token": "x" * 32,
    "web_base_url": "https://www.soyl.cloud",
    "resend_api_key": "re_not_a_real_key",
    "email_from": "SOYL <notifications@soyl.cloud>",
}


def build(**overrides: object) -> Settings:
    return Settings(**{**PROD, **overrides})  # type: ignore[arg-type]


def test_a_valid_production_configuration_is_accepted() -> None:
    assert build().environment == "prod"


def test_an_unknown_setting_is_a_startup_error() -> None:
    # SOYL_DATABSE_URL should crash, not fall back to a default.
    with pytest.raises(ValidationError, match=r"[Ee]xtra"):
        build(databse_url="postgresql+asyncpg://soyl_app:pw@db.example.com:5432/soyl")


def test_settings_are_immutable() -> None:
    settings = build()
    with pytest.raises(ValidationError):
        settings.environment = "local"  # type: ignore[misc]


@pytest.mark.parametrize("host", ["localhost", "127.0.0.1"])
def test_production_refuses_a_local_database(host: str) -> None:
    with pytest.raises(ValidationError, match="points at"):
        build(database_url=f"postgresql+asyncpg://soyl_app:pw@{host}:5432/soyl")


def test_production_refuses_to_connect_as_the_migrator() -> None:
    """The single most expensive misconfiguration available to us.

    soyl_migrator owns every table. A deploy that connects as it is one
    ``NO FORCE`` away from seeing every tenant at once, and nothing would look
    wrong until it did.
    """
    with pytest.raises(ValidationError, match="soyl_app"):
        build(database_url="postgresql+asyncpg://soyl_migrator:pw@db.example.com:5432/soyl")


def test_production_refuses_a_synchronous_driver() -> None:
    with pytest.raises(ValidationError, match="asyncpg"):
        build(database_url="postgresql://soyl_app:pw@db.example.com:5432/soyl")


def test_a_short_lead_token_is_rejected() -> None:
    # A guessable shared secret on the one endpoint reachable without a session.
    with pytest.raises(ValidationError):
        build(lead_ingest_token="short")


def test_local_is_allowed_to_point_at_localhost() -> None:
    settings = build(
        environment="local",
        database_url="postgresql+asyncpg://soyl_app:pw@localhost:5433/soyl",
    )
    assert settings.environment == "local"


def test_local_may_connect_as_the_migrator() -> None:
    """Deliberate.

    Local development runs migrations and the app from the same shell, and
    forcing the distinction there buys nothing while costing setup time. The
    invariant that matters is on staging and prod.
    """
    settings = build(
        environment="local",
        database_url="postgresql+asyncpg://soyl_migrator:pw@localhost:5433/soyl",
    )
    assert settings.environment == "local"


def test_production_refuses_a_localhost_web_base_url() -> None:
    """A verification link pointing at localhost is a signup funnel that ends."""
    with pytest.raises(ValidationError, match="localhost"):
        build(web_base_url="http://localhost:3000")


def test_production_refuses_a_plaintext_web_base_url() -> None:
    with pytest.raises(ValidationError, match="https"):
        build(web_base_url="http://www.soyl.cloud")


@pytest.mark.parametrize("missing", ["resend_api_key", "email_from"])
def test_production_refuses_to_start_without_email(missing: str) -> None:
    """Signup cannot verify an address without a sender.

    Booting anyway means every new account is stuck unverified and nobody
    finds out until a customer says so.
    """
    with pytest.raises(ValidationError, match="RESEND|EMAIL_FROM"):
        build(**{missing: None})


def test_local_needs_neither_email_nor_https() -> None:
    settings = build(
        environment="local",
        database_url="postgresql+asyncpg://soyl_app:pw@localhost:5433/soyl",
        web_base_url="http://localhost:3000",
        resend_api_key=None,
        email_from=None,
    )
    assert settings.environment == "local"
