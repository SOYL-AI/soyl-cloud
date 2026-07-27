"""M2's acceptance criterion: two tenants, and neither can read the other's
rows **through any API route**.

M1's suite proved isolation at the repository layer. This one goes through
HTTP, which is where the failures that layer cannot see would show: a route
that forgot the `authenticated` dependency, a handler that opened its own
session, a scope check that was never called. A repository test passes happily
while any of those is true.

Everything below is built the way a real user would build it — signup, login,
create a tenant, create a property — so the fixtures exercise the same code
paths the product does.
"""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator
from dataclasses import dataclass

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncEngine
from sqlalchemy.sql import text

from soyl.main import create_app
from soyl.settings import Settings
from tests.conftest import ApiTestSettings

PASSWORD = "a-perfectly-reasonable-passphrase"


@dataclass(frozen=True, slots=True)
class Tenant:
    """Everything needed to act as one tenant's owner."""

    email: str
    token: str
    tenant_id: uuid.UUID
    property_id: uuid.UUID
    property_name: str

    @property
    def headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.token}"}


@pytest.fixture
async def client(settings: ApiTestSettings, wipe: None) -> AsyncIterator[AsyncClient]:
    app = create_app(
        Settings(  # type: ignore[arg-type]
            environment="local",
            database_url=str(settings.database_url),
            redis_url="redis://localhost:6380/0",
            lead_ingest_token="a" * 32,
            web_base_url="http://localhost:3000",
        )
    )
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as http:
        async with app.router.lifespan_context(app):
            yield http


@pytest.fixture
async def wipe(migrator_engine: AsyncEngine) -> AsyncIterator[None]:
    async def clear() -> None:
        async with migrator_engine.connect() as connection:
            await connection.execute(
                text(
                    "TRUNCATE core.session, core.credential_token, core.oauth_account, "
                    "core.membership_property, core.membership, core.property, core.tenant, "
                    "core.user_account CASCADE"
                )
            )
            await connection.commit()

    await clear()
    yield
    await clear()


async def build_tenant(client: AsyncClient, label: str) -> Tenant:
    """Sign up, log in, create a tenant and a property — as a user would."""
    email = f"owner-{label}-{uuid.uuid4().hex[:8]}@example.com"

    await client.post("/v1/auth/signup", json={"email": email, "password": PASSWORD})
    login = await client.post("/v1/auth/login", json={"email": email, "password": PASSWORD})
    assert login.status_code == 200, login.text
    token = login.json()["session_token"]
    headers = {"Authorization": f"Bearer {token}"}

    tenant = await client.post(
        "/v1/tenants",
        headers=headers,
        json={"name": f"Tenant {label}", "slug": f"tenant-{label}-{uuid.uuid4().hex[:6]}",
              "country": "IN"},
    )
    assert tenant.status_code == 201, tenant.text
    tenant_id = uuid.UUID(tenant.json()["id"])

    property_name = f"{label} Hotel"
    created = await client.post(
        "/v1/properties",
        headers=headers,
        json={"name": property_name, "rooms_total": 84},
    )
    assert created.status_code == 201, created.text

    return Tenant(
        email=email,
        token=token,
        tenant_id=tenant_id,
        property_id=uuid.UUID(created.json()["id"]),
        property_name=property_name,
    )


@pytest.fixture
async def tenants(client: AsyncClient) -> tuple[Tenant, Tenant]:
    return await build_tenant(client, "a"), await build_tenant(client, "b")


# ── The acceptance criterion ────────────────────────────────────────────────


async def test_two_tenants_exist_each_with_a_property(
    tenants: tuple[Tenant, Tenant],
) -> None:
    a, b = tenants

    assert a.tenant_id != b.tenant_id
    assert a.property_id != b.property_id


async def test_listing_properties_returns_only_your_own(
    client: AsyncClient, tenants: tuple[Tenant, Tenant]
) -> None:
    a, b = tenants

    response = await client.get("/v1/properties", headers=b.headers)

    assert response.status_code == 200
    returned = {uuid.UUID(p["id"]) for p in response.json()}
    assert returned == {b.property_id}
    assert a.property_id not in returned
    # Not just the ids — the response must not carry the other tenant's name
    # anywhere in it.
    assert a.property_name not in response.text


async def test_fetching_another_tenants_property_by_id_is_404(
    client: AsyncClient, tenants: tuple[Tenant, Tenant]
) -> None:
    """404, not 403.

    A 403 would confirm the id names a real row, which is a cross-tenant
    existence oracle over an identifier someone could have seen in a URL.
    """
    a, b = tenants

    response = await client.get(f"/v1/properties/{a.property_id}", headers=b.headers)

    assert response.status_code == 404


async def test_current_tenant_is_your_own(
    client: AsyncClient, tenants: tuple[Tenant, Tenant]
) -> None:
    _, b = tenants

    response = await client.get("/v1/tenants/current", headers=b.headers)

    assert response.status_code == 200
    assert uuid.UUID(response.json()["id"]) == b.tenant_id
    assert response.json()["name"] == "Tenant b"


async def test_a_property_created_by_b_is_invisible_to_a(
    client: AsyncClient, tenants: tuple[Tenant, Tenant]
) -> None:
    a, b = tenants

    await client.post(
        "/v1/properties", headers=b.headers, json={"name": "B's second hotel", "rooms_total": 12}
    )
    response = await client.get("/v1/properties", headers=a.headers)

    assert response.status_code == 200
    assert "B's second hotel" not in response.text
    assert len(response.json()) == 1


# ── Everything an unauthenticated or stale caller must not reach ────────────


@pytest.mark.parametrize(
    ("method", "path"),
    [
        ("GET", "/v1/properties"),
        ("GET", "/v1/tenants/current"),
        ("POST", "/v1/properties"),
        ("POST", "/v1/tenants"),
    ],
)
async def test_every_protected_route_refuses_an_anonymous_caller(
    client: AsyncClient, method: str, path: str
) -> None:
    response = await client.request(method, path, json={})

    assert response.status_code == 401


@pytest.mark.parametrize(
    ("method", "path"),
    [("GET", "/v1/properties"), ("GET", "/v1/tenants/current"), ("POST", "/v1/properties")],
)
async def test_every_protected_route_refuses_a_garbage_token(
    client: AsyncClient, method: str, path: str
) -> None:
    response = await client.request(
        method, path, headers={"Authorization": "Bearer not-a-real-token"}, json={}
    )

    assert response.status_code == 401


async def test_a_revoked_session_stops_working_immediately(
    client: AsyncClient, tenants: tuple[Tenant, Tenant]
) -> None:
    """The property a JWT-only session could not give us.

    Logging out revokes the database row, so the token is dead on the next
    request rather than at its expiry.
    """
    _, b = tenants

    assert (await client.get("/v1/properties", headers=b.headers)).status_code == 200

    await client.post("/v1/auth/logout", headers=b.headers)

    assert (await client.get("/v1/properties", headers=b.headers)).status_code == 401


async def test_a_user_with_no_tenant_gets_409_not_401(client: AsyncClient) -> None:
    """Signed in, not yet onboarded.

    401 would send them to a login page they are already past, which is a loop
    with no exit.
    """
    email = f"nobody-{uuid.uuid4().hex[:8]}@example.com"
    await client.post("/v1/auth/signup", json={"email": email, "password": PASSWORD})
    login = await client.post("/v1/auth/login", json={"email": email, "password": PASSWORD})
    headers = {"Authorization": f"Bearer {login.json()['session_token']}"}

    response = await client.get("/v1/properties", headers=headers)

    assert response.status_code == 409


async def test_creating_a_tenant_activates_it_on_the_existing_session(
    client: AsyncClient,
) -> None:
    """The session predates the membership, so it must be updated in place.

    Without that, a user who has just created their tenant is an owner who
    cannot reach anything until they sign in again.
    """
    email = f"fresh-{uuid.uuid4().hex[:8]}@example.com"
    await client.post("/v1/auth/signup", json={"email": email, "password": PASSWORD})
    login = await client.post("/v1/auth/login", json={"email": email, "password": PASSWORD})
    headers = {"Authorization": f"Bearer {login.json()['session_token']}"}

    assert (await client.get("/v1/properties", headers=headers)).status_code == 409

    await client.post(
        "/v1/tenants",
        headers=headers,
        json={"name": "Fresh", "slug": f"fresh-{uuid.uuid4().hex[:6]}", "country": "IN"},
    )

    # Same token, no re-login.
    assert (await client.get("/v1/properties", headers=headers)).status_code == 200


async def test_a_slug_that_is_not_a_slug_is_refused(client: AsyncClient) -> None:
    email = f"slug-{uuid.uuid4().hex[:8]}@example.com"
    await client.post("/v1/auth/signup", json={"email": email, "password": PASSWORD})
    login = await client.post("/v1/auth/login", json={"email": email, "password": PASSWORD})
    headers = {"Authorization": f"Bearer {login.json()['session_token']}"}

    response = await client.post(
        "/v1/tenants",
        headers=headers,
        json={"name": "Bad", "slug": "Not A Slug", "country": "IN"},
    )

    assert response.status_code == 422


# ── The audit log ───────────────────────────────────────────────────────────


async def test_auth_events_are_recorded(
    client: AsyncClient, tenants: tuple[Tenant, Tenant], migrator_engine: AsyncEngine
) -> None:
    """M2's other acceptance criterion: the audit log records every auth event."""
    a, _ = tenants

    # audit.log has FORCE ROW LEVEL SECURITY, so even the table owner sees only
    # rows matching app.tenant_id. Reading a tenant's audit trail means being
    # scoped to that tenant — which is the design, and worth asserting.
    async with migrator_engine.connect() as connection:
        await connection.execute(
            text("SELECT set_config('app.tenant_id', :tid, TRUE)"), {"tid": str(a.tenant_id)}
        )
        tenanted = (
            await connection.execute(text("SELECT action FROM audit.log"))
        ).all()

    async with migrator_engine.connect() as connection:
        untenanted = (
            await connection.execute(text("SELECT action FROM audit.log"))
        ).all()

    actions = {row.action for row in tenanted} | {row.action for row in untenanted}
    assert {"auth.signup", "auth.login", "tenant.create", "property.create"} <= actions

    # And the tenant-scoped read must not have leaked another tenant's events.
    assert {row.action for row in tenanted} <= {"tenant.create", "property.create"}


async def test_a_failed_login_is_recorded_as_a_failure(
    client: AsyncClient, tenants: tuple[Tenant, Tenant], migrator_engine: AsyncEngine
) -> None:
    a, _ = tenants

    await client.post("/v1/auth/login", json={"email": a.email, "password": "wrong-password-here"})

    async with migrator_engine.connect() as connection:
        failures = (
            await connection.execute(
                text(
                    "SELECT after FROM audit.log "
                    "WHERE action = 'auth.login' AND outcome = 'failure'"
                )
            )
        ).all()

    assert failures, "a failed login was not recorded"
    # The reason is kept for us and never returned to the caller.
    assert any(row.after and row.after.get("reason") == "bad_password" for row in failures)
