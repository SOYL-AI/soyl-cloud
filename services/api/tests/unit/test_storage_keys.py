"""Key construction and filename safety.

Pure functions, and the place a path-traversal bug would live if there were
one — a filename arrives from a browser and ends up in an object key.
"""

from __future__ import annotations

import uuid

import pytest

from soyl.domain.storage import document_key, safe_filename

TENANT = uuid.UUID("11111111-1111-1111-1111-111111111111")
DOCUMENT = uuid.UUID("22222222-2222-2222-2222-222222222222")


def test_an_ordinary_filename_survives_intact() -> None:
    assert safe_filename("Guest-Complaint-SOP_v4.pdf") == "Guest-Complaint-SOP_v4.pdf"


@pytest.mark.parametrize(
    "name",
    [
        "../../etc/passwd",
        "../../../secrets.env",
        "/absolute/path.pdf",
        "folder/nested.pdf",
        "back\\slash.pdf",
    ],
)
def test_traversal_and_separators_cannot_survive(name: str) -> None:
    cleaned = safe_filename(name)

    assert "/" not in cleaned
    assert "\\" not in cleaned
    assert ".." not in cleaned


def test_unicode_is_folded_rather_than_passed_through() -> None:
    # A name that renders as one thing and resolves as another is how a key
    # ends up somewhere nobody expected.
    assert safe_filename("Café Menü.pdf") == "Cafe-Menu.pdf"


def test_a_name_of_only_unsafe_characters_still_produces_a_key() -> None:
    # Returning "" here would produce a key ending in a slash, which is a
    # directory marker in most object stores rather than an object.
    assert safe_filename("///...///") == "document"
    assert safe_filename("") == "document"


def test_truncation_keeps_the_extension() -> None:
    # "report" tells you nothing about the bytes; "report.pdf" does.
    cleaned = safe_filename("a" * 300 + ".pdf", max_length=40)

    assert len(cleaned) <= 40
    assert cleaned.endswith(".pdf")


def test_truncation_without_a_sensible_extension_just_truncates() -> None:
    cleaned = safe_filename("b" * 300, max_length=40)

    assert len(cleaned) == 40


def test_the_key_is_tenant_first() -> None:
    """Prefix order is what makes "delete everything for this customer" bounded.

    Tenant-first means a lifecycle rule or a bulk delete is a prefix operation.
    Any other order makes it a full scan.
    """
    key = document_key(tenant_id=TENANT, document_id=DOCUMENT, filename="sop.pdf")

    assert key.startswith(f"tenants/{TENANT}/")
    assert key == f"tenants/{TENANT}/documents/{DOCUMENT}/sop.pdf"


def test_two_documents_with_the_same_filename_do_not_collide() -> None:
    other = uuid.uuid4()

    assert document_key(tenant_id=TENANT, document_id=DOCUMENT, filename="menu.pdf") != (
        document_key(tenant_id=TENANT, document_id=other, filename="menu.pdf")
    )


def test_a_hostile_filename_cannot_escape_its_tenant_prefix() -> None:
    """The assertion that matters.

    If a filename could inject separators, a document could be written into
    another tenant's prefix — which is the one thing object storage has no
    row-level security to fall back on.
    """
    key = document_key(
        tenant_id=TENANT,
        document_id=DOCUMENT,
        filename="../../../tenants/99999999-9999-9999-9999-999999999999/documents/evil.pdf",
    )

    assert key.startswith(f"tenants/{TENANT}/documents/{DOCUMENT}/")
    assert key.count("tenants/") == 1
