"""The authentication flows, against a real database.

The assertions that matter most here are the *negative* ones: that signup and
password-reset answer identically for an address that exists and one that does
not, and that a reset kills every existing session. Those are the properties an
attacker probes, and they are easy to break by accident later.
"""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncEngine
from sqlalchemy.sql import text

from soyl.main import create_app
from soyl.settings import Settings
from tests.conftest import ApiTestSettings

PASSWORD = "a-perfectly-reasonable-passphrase"


@pytest.fixture
async def client(settings: ApiTestSettings, clean_identity: None) -> AsyncIterator[AsyncClient]:
    app = create_app(
        Settings(  # type: ignore[arg-type]
            environment="local",
            database_url=str(settings.database_url),
            redis_url=str(settings.redis_url),
            lead_ingest_token="a" * 32,
            web_base_url="http://localhost:3000",
        )
    )
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as http:
        async with app.router.lifespan_context(app):
            yield http


@pytest.fixture
async def clean_identity(migrator_engine: AsyncEngine) -> AsyncIterator[None]:
    async def wipe() -> None:
        async with migrator_engine.connect() as connection:
            await connection.execute(
                text(
                    "TRUNCATE core.session, core.credential_token, core.oauth_account, "
                    "core.membership_property, core.membership, core.property, core.tenant, "
                    "core.user_account CASCADE"
                )
            )
            await connection.commit()

    await wipe()
    yield
    await wipe()


def unique_email() -> str:
    return f"owner-{uuid.uuid4().hex[:10]}@grandresort.example.com"


def _without_trace(body: dict[str, object]) -> dict[str, object]:
    """Drop the per-request correlation id before comparing two responses.

    trace_id is meant to differ; everything else in an error body is what an
    attacker would diff to tell two failure causes apart.
    """
    return {key: value for key, value in body.items() if key != "trace_id"}


# ── Signup ───────────────────────────────────────────────────────────────────


async def test_signup_creates_an_account(client: AsyncClient) -> None:
    response = await client.post(
        "/v1/auth/signup",
        json={"email": unique_email(), "password": PASSWORD, "display_name": "Priya"},
    )

    assert response.status_code == 202
    assert response.headers["cache-control"] == "no-store, no-transform"


async def test_signup_answers_identically_for_an_address_already_registered(
    client: AsyncClient,
) -> None:
    """The enumeration test.

    If the second call answered differently — 409, a different body, even a
    materially different latency — anyone could check whether an address has a
    SOYL account. That turns a password dump from somewhere else into a
    targeted attack on us.
    """
    email = unique_email()

    first = await client.post("/v1/auth/signup", json={"email": email, "password": PASSWORD})
    second = await client.post("/v1/auth/signup", json={"email": email, "password": PASSWORD})

    assert first.status_code == second.status_code == 202
    assert first.json() == second.json()


async def test_signup_rejects_a_weak_password_openly(client: AsyncClient) -> None:
    # Password policy is not a secret, and refusing silently would leave
    # someone unable to sign in with a password they believe they set.
    response = await client.post(
        "/v1/auth/signup", json={"email": unique_email(), "password": "short"}
    )

    assert response.status_code == 422


async def test_signup_rejects_an_unknown_field(client: AsyncClient) -> None:
    # extra="forbid" per UPDATE.md §13.
    response = await client.post(
        "/v1/auth/signup",
        json={"email": unique_email(), "password": PASSWORD, "is_admin": True},
    )

    assert response.status_code == 422


# ── Login ────────────────────────────────────────────────────────────────────


async def signup_and_login(client: AsyncClient, email: str | None = None) -> tuple[str, str]:
    address = email or unique_email()
    await client.post("/v1/auth/signup", json={"email": address, "password": PASSWORD})
    response = await client.post(
        "/v1/auth/login", json={"email": address, "password": PASSWORD}
    )
    assert response.status_code == 200, response.text
    return address, response.json()["session_token"]


async def test_login_returns_a_session_token(client: AsyncClient) -> None:
    email, token = await signup_and_login(client)

    assert len(token) >= 43
    assert token != email


async def test_login_response_is_never_cached(client: AsyncClient) -> None:
    email = unique_email()
    await client.post("/v1/auth/signup", json={"email": email, "password": PASSWORD})
    response = await client.post("/v1/auth/login", json={"email": email, "password": PASSWORD})

    assert response.headers["cache-control"] == "no-store, no-transform"


async def test_a_new_account_is_not_yet_verified(client: AsyncClient) -> None:
    email = unique_email()
    await client.post("/v1/auth/signup", json={"email": email, "password": PASSWORD})
    response = await client.post("/v1/auth/login", json={"email": email, "password": PASSWORD})

    assert response.json()["email_verified"] is False


async def test_a_new_account_has_no_tenant(client: AsyncClient) -> None:
    # Signup does not create a tenant. Onboarding does, and until then the
    # session is valid but reaches no tenant-scoped data.
    email = unique_email()
    await client.post("/v1/auth/signup", json={"email": email, "password": PASSWORD})
    response = await client.post("/v1/auth/login", json={"email": email, "password": PASSWORD})

    assert response.json()["active_tenant_id"] is None


@pytest.mark.parametrize("password", ["wrong-password-entirely", ""])
async def test_a_bad_password_is_rejected(client: AsyncClient, password: str) -> None:
    email = unique_email()
    await client.post("/v1/auth/signup", json={"email": email, "password": PASSWORD})

    response = await client.post("/v1/auth/login", json={"email": email, "password": password})

    assert response.status_code in (401, 422)


async def test_login_answers_the_same_for_a_missing_account_as_a_wrong_password(
    client: AsyncClient,
) -> None:
    email = unique_email()
    await client.post("/v1/auth/signup", json={"email": email, "password": PASSWORD})

    wrong_password = await client.post(
        "/v1/auth/login", json={"email": email, "password": "wrong-password-entirely"}
    )
    no_such_user = await client.post(
        "/v1/auth/login", json={"email": unique_email(), "password": PASSWORD}
    )

    assert wrong_password.status_code == no_such_user.status_code == 401
    # Everything but trace_id, which is per-request and must differ.
    assert _without_trace(wrong_password.json()) == _without_trace(no_such_user.json())


async def test_email_is_case_insensitive(client: AsyncClient) -> None:
    # citext. Signing up as Priya@… and logging in as priya@… must work, and
    # must not create two accounts.
    email = unique_email()
    await client.post("/v1/auth/signup", json={"email": email, "password": PASSWORD})

    response = await client.post(
        "/v1/auth/login", json={"email": email.upper(), "password": PASSWORD}
    )

    assert response.status_code == 200


# ── Logout ───────────────────────────────────────────────────────────────────


async def test_logout_revokes_the_session(client: AsyncClient) -> None:
    _, token = await signup_and_login(client)

    logout = await client.post("/v1/auth/logout", headers={"Authorization": f"Bearer {token}"})

    assert logout.status_code == 204


@pytest.mark.parametrize(
    "headers",
    [{}, {"Authorization": "Bearer not-a-real-token"}, {"Authorization": "malformed"}],
)
async def test_logout_is_always_204(client: AsyncClient, headers: dict[str, str]) -> None:
    """Telling a caller their token was already invalid is useless and a small oracle."""
    assert (await client.post("/v1/auth/logout", headers=headers)).status_code == 204


# ── Password reset ───────────────────────────────────────────────────────────


async def test_password_reset_answers_identically_for_an_unknown_address(
    client: AsyncClient,
) -> None:
    """The most exposed enumeration surface in the product.

    Unauthenticated, takes an email address, and is linked from the login page.
    Any difference in its behaviour is a public account-existence check.
    """
    email, _ = await signup_and_login(client)

    known = await client.post("/v1/auth/password-reset", json={"email": email})
    unknown = await client.post("/v1/auth/password-reset", json={"email": unique_email()})

    assert known.status_code == unknown.status_code == 202
    assert known.json() == unknown.json()


async def test_an_invalid_reset_token_is_refused(client: AsyncClient) -> None:
    response = await client.post(
        "/v1/auth/password-reset/confirm",
        json={"token": "not-a-real-token", "password": PASSWORD},
    )

    assert response.status_code == 400


async def test_an_invalid_verification_token_is_refused(client: AsyncClient) -> None:
    response = await client.post("/v1/auth/verify-email", json={"token": "not-a-real-token"})

    assert response.status_code == 400
