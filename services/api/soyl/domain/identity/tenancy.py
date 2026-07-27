"""Tenant context.

Pure domain: no SQLAlchemy, no FastAPI. `import-linter` enforces that, and the
reason is not purity for its own sake — it is that `TenantContext` is resolved
from a session in M2, from a signed JWT when the web app calls the API, and
from a job payload in the M3 worker. Three callers, one type.
"""

from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID


@dataclass(frozen=True, slots=True)
class TenantContext:
    """The tenant a unit of work belongs to.

    Frozen because a request must not be able to change tenant halfway through:
    the value has already been written into the database transaction's
    ``app.tenant_id`` by the time anything reads it.
    """

    tenant_id: UUID

    def __str__(self) -> str:
        return str(self.tenant_id)
