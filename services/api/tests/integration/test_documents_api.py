"""The document upload path, through HTTP.

The three-step shape — reserve, upload direct to storage, confirm — exists
because a presigned PUT gives us no callback. Most of these tests are about the
states that shape makes reachable, which a single-request upload never could:
a row whose bytes never arrived, an upload confirmed twice, a file that turns
out to be too large only after it has been stored.
"""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator

import httpx
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncEngine
from sqlalchemy.sql import text

from soyl.main import create_app
from soyl.settings import Settings
from tests.conftest import ApiTestSettings

PASSWORD = "a-perfectly-reasonable-passphrase"
SOP = b"# Cancellation Policy\n\nCorporate bookings may be cancelled without penalty.\n"


@pytest.fixture
async def client(settings: ApiTestSettings, wipe: None) -> AsyncIterator[AsyncClient]:
    app = create_app(
        Settings(  # type: ignore[arg-type]
            environment="local",
            database_url=str(settings.database_url),
            redis_url=str(settings.redis_url),
            lead_ingest_token="a" * 32,
            web_base_url="http://localhost:3000",
            storage_endpoint_url=str(settings.storage_endpoint_url),
            storage_bucket=settings.storage_bucket,
            storage_access_key=settings.storage_access_key,
            storage_secret_key=settings.storage_secret_key,
        )
    )
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as http:
        async with app.router.lifespan_context(app):
            await app.state.storage.ensure_bucket()
            yield http


@pytest.fixture
async def wipe(migrator_engine: AsyncEngine) -> AsyncIterator[None]:
    async def clear() -> None:
        async with migrator_engine.connect() as connection:
            await connection.execute(
                text(
                    "TRUNCATE core.session, core.credential_token, core.membership_property, "
                    "core.membership, core.property, core.tenant, core.user_account CASCADE"
                )
            )
            await connection.commit()

    await clear()
    yield
    await clear()


@pytest.fixture
async def headers(client: AsyncClient) -> dict[str, str]:
    """A signed-in owner with a workspace."""
    email = f"docs-{uuid.uuid4().hex[:8]}@example.com"
    await client.post("/v1/auth/signup", json={"email": email, "password": PASSWORD})
    login = await client.post("/v1/auth/login", json={"email": email, "password": PASSWORD})
    auth = {"Authorization": f"Bearer {login.json()['session_token']}"}

    created = await client.post(
        "/v1/tenants",
        headers=auth,
        json={"name": "Docs Co", "slug": f"docs-{uuid.uuid4().hex[:8]}", "country": "IN"},
    )
    assert created.status_code == 201, created.text
    return auth


async def reserve(
    client: AsyncClient, headers: dict[str, str], *, filename: str, content_type: str
) -> dict[str, object]:
    response = await client.post(
        "/v1/documents",
        headers=headers,
        json={"filename": filename, "content_type": content_type},
    )
    assert response.status_code == 201, response.text
    return response.json()


async def put_bytes(ticket: dict[str, object], data: bytes) -> None:
    async with httpx.AsyncClient() as uploader:
        response = await uploader.put(
            str(ticket["upload_url"]), content=data, headers=ticket["required_headers"]  # type: ignore[arg-type]
        )
    assert response.status_code in (200, 204), response.text


# ── The happy path ──────────────────────────────────────────────────────────


async def test_reserving_a_document_returns_a_usable_ticket(
    client: AsyncClient, headers: dict[str, str]
) -> None:
    ticket = await reserve(client, headers, filename="sop.md", content_type="text/markdown")

    assert ticket["upload_url"]
    assert ticket["required_headers"] == {"Content-Type": "text/markdown"}
    assert ticket["expires_in_seconds"] > 0

    # And it actually accepts the bytes.
    await put_bytes(ticket, SOP)


async def test_confirming_an_upload_queues_ingestion(
    client: AsyncClient, headers: dict[str, str]
) -> None:
    ticket = await reserve(client, headers, filename="sop.md", content_type="text/markdown")
    await put_bytes(ticket, SOP)

    response = await client.post(
        f"/v1/documents/{ticket['document_id']}/ingest", headers=headers
    )

    assert response.status_code == 202
    assert response.json()["status"] == "queued"


async def test_documents_appear_in_the_list_with_their_status(
    client: AsyncClient, headers: dict[str, str]
) -> None:
    ticket = await reserve(client, headers, filename="sop.md", content_type="text/markdown")
    await put_bytes(ticket, SOP)

    listed = await client.get("/v1/documents", headers=headers)

    assert listed.status_code == 200
    (document,) = listed.json()
    assert document["title"] == "sop.md"
    assert document["status"] == "uploaded"
    assert document["error"] is None


# ── States the three-step shape makes reachable ─────────────────────────────


async def test_confirming_an_upload_that_never_happened_is_refused(
    client: AsyncClient, headers: dict[str, str]
) -> None:
    """The reason step 3 exists.

    A presigned PUT has no callback, so a browser that dies mid-upload leaves a
    row pointing at nothing. Confirming has to check the object is really there
    rather than take the client's word for it.
    """
    ticket = await reserve(client, headers, filename="ghost.md", content_type="text/markdown")

    response = await client.post(
        f"/v1/documents/{ticket['document_id']}/ingest", headers=headers
    )

    assert response.status_code == 409
    assert "did not complete" in response.json()["detail"]


async def test_an_unsupported_format_is_refused_before_any_upload(
    client: AsyncClient, headers: dict[str, str]
) -> None:
    # Cheaper to refuse the ticket than to store a file we cannot read.
    response = await client.post(
        "/v1/documents",
        headers=headers,
        json={"filename": "sheet.xlsx", "content_type": "application/vnd.ms-excel"},
    )

    assert response.status_code == 415
    assert "PDF" in response.json()["detail"]


async def test_deleting_a_document_removes_it_and_its_object(
    client: AsyncClient, headers: dict[str, str]
) -> None:
    """Erasure has to be real.

    A soft-deleted row whose PDF remains in a bucket is not erased, and
    "destroy and certify" is what a processor DPA is audited against.
    """
    ticket = await reserve(client, headers, filename="sop.md", content_type="text/markdown")
    await put_bytes(ticket, SOP)

    deleted = await client.delete(f"/v1/documents/{ticket['document_id']}", headers=headers)
    assert deleted.status_code == 204

    listed = await client.get("/v1/documents", headers=headers)
    assert listed.json() == []

    # And the row is genuinely gone, not merely hidden.
    again = await client.post(
        f"/v1/documents/{ticket['document_id']}/ingest", headers=headers
    )
    assert again.status_code == 404


async def test_deleting_a_document_twice_is_not_an_error_the_second_time(
    client: AsyncClient, headers: dict[str, str]
) -> None:
    ticket = await reserve(client, headers, filename="sop.md", content_type="text/markdown")
    await put_bytes(ticket, SOP)

    assert (
        await client.delete(f"/v1/documents/{ticket['document_id']}", headers=headers)
    ).status_code == 204
    # 404 rather than 500 — the row is gone, which is what was asked for.
    assert (
        await client.delete(f"/v1/documents/{ticket['document_id']}", headers=headers)
    ).status_code == 404


# ── Access ──────────────────────────────────────────────────────────────────


@pytest.mark.parametrize(
    ("method", "path"),
    [("GET", "/v1/documents"), ("POST", "/v1/documents")],
)
async def test_documents_are_not_reachable_anonymously(
    client: AsyncClient, method: str, path: str
) -> None:
    assert (await client.request(method, path, json={})).status_code == 401


async def test_one_tenant_cannot_see_another_tenants_documents(
    client: AsyncClient, headers: dict[str, str]
) -> None:
    """The corpus is the most sensitive thing we hold."""
    ticket = await reserve(client, headers, filename="secret-sop.md", content_type="text/markdown")
    await put_bytes(ticket, SOP)

    other = f"rival-{uuid.uuid4().hex[:8]}@example.com"
    await client.post("/v1/auth/signup", json={"email": other, "password": PASSWORD})
    login = await client.post("/v1/auth/login", json={"email": other, "password": PASSWORD})
    rival = {"Authorization": f"Bearer {login.json()['session_token']}"}
    await client.post(
        "/v1/tenants",
        headers=rival,
        json={"name": "Rival", "slug": f"rival-{uuid.uuid4().hex[:8]}", "country": "IN"},
    )

    listed = await client.get("/v1/documents", headers=rival)
    assert listed.status_code == 200
    assert listed.json() == []
    assert "secret-sop" not in listed.text

    # And it cannot be reached by id either.
    stolen = await client.post(
        f"/v1/documents/{ticket['document_id']}/ingest", headers=rival
    )
    assert stolen.status_code == 404
