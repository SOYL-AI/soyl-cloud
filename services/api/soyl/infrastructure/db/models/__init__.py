"""Every model, imported here so Alembic's autogenerate sees the full metadata.

A model that is not imported here is invisible to migrations, which fails
silently and is discovered only when a table is missing in production.
"""

from soyl.infrastructure.db.base import Base
from soyl.infrastructure.db.models.core import (
    Membership,
    MembershipProperty,
    Property,
    Tenant,
    UserAccount,
)
from soyl.infrastructure.db.models.lead import Lead

__all__ = [
    "Base",
    "Lead",
    "Membership",
    "MembershipProperty",
    "Property",
    "Tenant",
    "UserAccount",
]
