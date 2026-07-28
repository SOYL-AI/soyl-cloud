"""The S3 adapter, against the real MinIO in the local stack.

Not a mock. The behaviours that matter here — whether a presigned PUT actually
accepts an upload, whether a signature verifies when the content type differs,
whether deleting a missing key raises — are precisely the ones a mock would
get wrong in whatever direction the author assumed.
"""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator

import httpx
import pytest

from soyl.domain.storage import ObjectNotFound, document_key
from soyl.infrastructure.storage.s3 import S3Storage
from tests.conftest import ApiTestSettings

TENANT = uuid.uuid4()


@pytest.fixture
async def storage(settings: ApiTestSettings) -> AsyncIterator[S3Storage]:
    store = S3Storage(
        endpoint_url=str(settings.storage_endpoint_url),
        region="us-east-1",
        bucket=settings.storage_bucket,
        access_key=settings.storage_access_key,
        secret_key=settings.storage_secret_key,
    )
    await store.ensure_bucket()
    yield store


def a_key() -> str:
    return document_key(tenant_id=TENANT, document_id=uuid.uuid4(), filename="sop.pdf")


async def test_a_presigned_ticket_actually_accepts_an_upload(storage: S3Storage) -> None:
    key = a_key()
    ticket = await storage.upload_ticket(key=key, content_type="application/pdf", max_bytes=10_000)

    async with httpx.AsyncClient() as client:
        response = await client.put(
            ticket.url, content=b"%PDF-1.7 fake", headers=ticket.required_headers
        )

    assert response.status_code in (200, 204), response.text
    assert await storage.download(key=key) == b"%PDF-1.7 fake"


async def test_the_signed_content_type_is_binding(storage: S3Storage) -> None:
    """The reason `required_headers` exists.

    Content-Type is signed into the URL. Uploading with a different one must
    fail — otherwise a ticket issued for a PDF could be used to store something
    that is later served as a script.
    """
    ticket = await storage.upload_ticket(
        key=a_key(), content_type="application/pdf", max_bytes=10_000
    )

    async with httpx.AsyncClient() as client:
        response = await client.put(
            ticket.url, content=b"<script>alert(1)</script>", headers={"Content-Type": "text/html"}
        )

    assert response.status_code == 403


async def test_a_ticket_is_for_exactly_one_key(storage: S3Storage) -> None:
    """A signature covers the key, so a ticket cannot be pointed elsewhere."""
    ticket = await storage.upload_ticket(
        key=a_key(), content_type="application/pdf", max_bytes=10_000
    )
    elsewhere = ticket.url.replace(ticket.key, a_key())

    async with httpx.AsyncClient() as client:
        response = await client.put(
            elsewhere, content=b"x", headers=ticket.required_headers
        )

    assert response.status_code == 403


async def test_downloading_something_absent_raises_not_found(storage: S3Storage) -> None:
    # Distinct from a transport failure: the ingestion worker treats these
    # differently, because one is retryable and the other never will be.
    with pytest.raises(ObjectNotFound):
        await storage.download(key=a_key())


async def test_exists_is_honest_in_both_directions(storage: S3Storage) -> None:
    key = a_key()
    assert await storage.exists(key=key) is False

    ticket = await storage.upload_ticket(key=key, content_type="text/plain", max_bytes=100)
    async with httpx.AsyncClient() as client:
        await client.put(ticket.url, content=b"here", headers=ticket.required_headers)

    assert await storage.exists(key=key) is True


async def test_delete_removes_the_object(storage: S3Storage) -> None:
    key = a_key()
    ticket = await storage.upload_ticket(key=key, content_type="text/plain", max_bytes=100)
    async with httpx.AsyncClient() as client:
        await client.put(ticket.url, content=b"here", headers=ticket.required_headers)

    await storage.delete(key=key)

    assert await storage.exists(key=key) is False


async def test_deleting_twice_is_not_an_error(storage: S3Storage) -> None:
    """Erasure has to be idempotent.

    A retried "delete everything for this customer" must not fail because the
    first attempt succeeded — that turns a completed erasure into one that
    reports failure, which is the worst possible answer to give a regulator.
    """
    key = a_key()

    await storage.delete(key=key)
    await storage.delete(key=key)
