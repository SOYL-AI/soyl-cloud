"""Every model, imported here so Alembic's autogenerate sees the full metadata.

A model that is not imported here is invisible to migrations, which fails
silently and is discovered only when a table is missing in production.
"""

from soyl.infrastructure.db.base import Base
from soyl.infrastructure.db.models.audit import AuditLog
from soyl.infrastructure.db.models.core import (
    Membership,
    MembershipProperty,
    Property,
    Tenant,
    UserAccount,
)
from soyl.infrastructure.db.models.identity import CredentialToken, OAuthAccount, Session
from soyl.infrastructure.db.models.lead import Lead
from soyl.infrastructure.db.models.rag import Document, IngestionJob

__all__ = [
    "AuditLog",
    "Base",
    "CredentialToken",
    "Document",
    "IngestionJob",
    "Lead",
    "Membership",
    "MembershipProperty",
    "OAuthAccount",
    "Property",
    "Session",
    "Tenant",
    "UserAccount",
]
