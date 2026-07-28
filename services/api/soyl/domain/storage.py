"""The storage port.

`UPDATE.md` §5 calls this "the one abstraction worth writing early", and it is
right for a specific reason: the handbook plans an eventual move from
S3-compatible storage to Azure Blob (§52.2), and the difference between that
being one file and being a three-week archaeology exercise is whether anything
outside this seam ever imported a storage SDK.

Pure domain — a Protocol and two value objects, no SDK, no I/O. `import-linter`
enforces that `soyl.domain` cannot reach `soyl.infrastructure`, so the rule is
checked rather than remembered.
"""

from __future__ import annotations

import re
import unicodedata
import uuid
from dataclasses import dataclass
from datetime import timedelta
from typing import Protocol


class StorageError(Exception):
    """Anything the storage backend refused or could not do."""


class ObjectNotFound(StorageError):
    """The key does not exist. Distinct from a permission or transport failure."""


@dataclass(frozen=True, slots=True)
class UploadTicket:
    """A short-lived permission to write exactly one object.

    The browser uploads straight to storage with this, so the file never passes
    through the API — a 40 MB PDF should not occupy a request worker, and
    Vercel's body limits would refuse it anyway.
    """

    url: str
    key: str
    expires_in: timedelta
    # Headers the client must send for the signature to verify. Getting these
    # wrong is the usual cause of a 403 that looks like a credentials problem.
    required_headers: dict[str, str]


class StoragePort(Protocol):
    """Everything the application may ask of object storage."""

    async def upload_ticket(
        self, *, key: str, content_type: str, max_bytes: int
    ) -> UploadTicket:
        """A time-limited, single-object write permission."""
        ...

    async def download(self, *, key: str) -> bytes:
        """Fetch an object whole. Raises `ObjectNotFound` if absent."""
        ...

    async def delete(self, *, key: str) -> None:
        """Remove an object. Deleting something already gone is not an error.

        Erasure has to be idempotent: a retried deletion request must not fail
        just because the first attempt succeeded.
        """
        ...

    async def exists(self, *, key: str) -> bool:
        ...


# ── Key construction ────────────────────────────────────────────────────────

# Conservative on purpose. Anything outside this is replaced rather than
# rejected, because a filename is a display detail and refusing an upload over
# a bracket would be absurd.
_UNSAFE = re.compile(r"[^a-zA-Z0-9._-]+")


def safe_filename(name: str, *, max_length: int = 120) -> str:
    """Reduce a user-supplied filename to something safe to put in a key.

    Guards traversal (`../`), separators, and the unicode tricks that make a
    name render as one thing and resolve as another.
    """
    normalised = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode("ascii")
    cleaned = _UNSAFE.sub("-", normalised).strip("-._")

    if not cleaned:
        return "document"

    # Preserve the extension when truncating; "report.pdf" truncated to
    # "report" loses the only hint about what the bytes are.
    if len(cleaned) > max_length:
        stem, _, suffix = cleaned.rpartition(".")
        if stem and len(suffix) <= 8:
            cleaned = f"{stem[: max_length - len(suffix) - 1]}.{suffix}"
        else:
            cleaned = cleaned[:max_length]

    return cleaned


def document_key(*, tenant_id: uuid.UUID, document_id: uuid.UUID, filename: str) -> str:
    """Where a document's bytes live.

    Tenant-first, so a whole tenant's objects can be listed or lifecycle-ruled
    by prefix — which is what "delete everything belonging to this customer"
    needs to be a bounded operation rather than a scan.

    The document id sits in the path so two files of the same name never
    collide, and so a key can be traced back to a row without a lookup table.
    """
    return f"tenants/{tenant_id}/documents/{document_id}/{safe_filename(filename)}"
