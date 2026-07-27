"""Who is making a request, and what they are allowed to do.

Layer 1 and layer 2 of handbook §23.2. Layer 3 — row-level security — is in
Postgres and is the one that cannot be forgotten. All three are independently
sufficient to deny, and this file is deliberately the *weakest* of them: if a
scope check is missed, RLS still stops a cross-tenant read.

The role vocabulary is `UPDATE.md` §7's, not the handbook's fuller
`general_manager` / `revenue_manager` / `fnb_manager` set. Those roles exist to
scope a metrics domain that Phase 0 does not build (`UPDATE.md` §4 puts it out
of scope), and inventing them now would mean inventing their scopes too.
"""

from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from uuid import UUID

# Role → scopes. Coarse and human-meaningful on the left, fine and
# machine-checked on the right (§23.2).
ROLE_SCOPES: dict[str, frozenset[str]] = {
    "owner": frozenset({"*:read", "*:write", "tenant:admin", "billing:read"}),
    "admin": frozenset({"*:read", "*:write", "tenant:admin"}),
    "manager": frozenset({"property:read", "property:write", "document:read", "document:write"}),
    "analyst": frozenset({"*:read"}),
    # Internal only. Grants nothing on its own — staff reach tenant data
    # through the audited impersonation path in M6, never by holding a
    # membership that quietly reads everything.
    "soyl_staff": frozenset({"staff:admin"}),
}


class Forbidden(Exception):
    """Authorisation failure. Distinct from authentication failure on purpose.

    A 401 tells the caller to log in; a 403 tells them logging in will not
    help. Conflating them sends people round a loop that cannot terminate.
    """

    def __init__(self, *, scope: str | None = None, reason: str | None = None) -> None:
        self.scope = scope
        self.reason = reason
        super().__init__(reason or f"missing scope: {scope}")


def scopes_for_roles(roles: Iterable[str]) -> frozenset[str]:
    """Union of the scopes each role grants. Unknown roles contribute nothing.

    Silently ignoring an unknown role is the safe direction: a role added to
    the database by a future migration should grant nothing until this map
    knows about it, rather than crash every request the moment it appears.
    """
    granted: set[str] = set()
    for role in roles:
        granted |= ROLE_SCOPES.get(role, frozenset())
    return frozenset(granted)


@dataclass(frozen=True, slots=True)
class Principal:
    """The authenticated caller, resolved once per request.

    Frozen: a request must not be able to change identity or tenant halfway
    through, because by the time anything reads this the tenant has already
    been written into the database transaction's ``app.tenant_id``.
    """

    user_id: UUID
    tenant_id: UUID
    session_id: UUID
    roles: frozenset[str]
    scopes: frozenset[str]
    # Effective property set, already expanded from `property_scope`.
    property_ids: frozenset[UUID]
    # 'all' means every property in the tenant, including ones created after
    # this principal was built — so an empty property_ids is not a denial.
    has_all_properties: bool

    def require(self, scope: str) -> None:
        if scope in self.scopes:
            return

        # A wildcard grant covers its own half. "*:write" also implies
        # "*:read": a role that may change something may certainly see it.
        _, _, action = scope.partition(":")
        if f"*:{action}" in self.scopes:
            return
        if action == "read" and "*:write" in self.scopes:
            return

        raise Forbidden(scope=scope)

    def can(self, scope: str) -> bool:
        try:
            self.require(scope)
        except Forbidden:
            return False
        return True

    def scope_properties(self, requested: Iterable[UUID]) -> frozenset[UUID]:
        """Narrow a requested property set to what this principal may see."""
        wanted = frozenset(requested)

        if self.has_all_properties:
            if not wanted:
                raise Forbidden(reason="no_properties_requested")
            return wanted

        allowed = wanted & self.property_ids
        if not allowed:
            raise Forbidden(reason="no_accessible_properties")
        return allowed

    def may_use_property(self, property_id: UUID) -> bool:
        return self.has_all_properties or property_id in self.property_ids
