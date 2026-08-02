"""Fixtures and helpers shared by the integration tests that go through HTTP.

Moved here from `test_api_tenant_isolation.py` when M6's admin suite needed the
same `client` and `wipe`. Importing a fixture from another test module *works*
— pytest resolves it — but the name then exists twice in the importing module,
once as an import and once as a parameter, and `ruff` flags every use as a
redefinition. It is flagging something real: a fixture imported by name is a
fixture that can be silently shadowed.

`conftest.py` is the mechanism pytest provides for exactly this, and it needs no
import at all. Plain helpers stay importable because they are ordinary
functions, not fixtures.
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
            redis_url=str(settings.redis_url),
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
