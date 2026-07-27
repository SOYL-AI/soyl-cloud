"""Scope resolution and property scoping."""

from __future__ import annotations

import uuid

import pytest

from soyl.domain.identity.principal import Forbidden, Principal, scopes_for_roles

PROPERTY_A = uuid.uuid4()
PROPERTY_B = uuid.uuid4()


def build(
    *, roles: set[str], property_ids: set[uuid.UUID] | None = None, all_properties: bool = False
) -> Principal:
    return Principal(
        user_id=uuid.uuid4(),
        tenant_id=uuid.uuid4(),
        session_id=uuid.uuid4(),
        roles=frozenset(roles),
        scopes=scopes_for_roles(roles),
        property_ids=frozenset(property_ids or set()),
        has_all_properties=all_properties,
    )


def test_an_owner_may_write() -> None:
    build(roles={"owner"}).require("property:write")


def test_an_analyst_may_read_but_not_write() -> None:
    analyst = build(roles={"analyst"})

    analyst.require("property:read")
    with pytest.raises(Forbidden) as raised:
        analyst.require("property:write")
    assert raised.value.scope == "property:write"


def test_write_access_implies_read_access() -> None:
    # A role that may change something may certainly see it. Without this, every
    # write role needs its read counterpart listed, and one will be forgotten.
    assert build(roles={"owner"}).can("document:read")


def test_read_access_does_not_imply_write_access() -> None:
    assert not build(roles={"analyst"}).can("document:write")


def test_a_manager_has_neither_tenant_admin_nor_a_wildcard() -> None:
    manager = build(roles={"manager"})

    assert manager.can("property:write")
    assert not manager.can("tenant:admin")
    assert not manager.can("billing:read")


def test_staff_membership_grants_no_tenant_data_access() -> None:
    # Staff reach tenant data through audited impersonation in M6, never by
    # holding a membership that quietly reads everything.
    staff = build(roles={"soyl_staff"})

    assert staff.can("staff:admin")
    assert not staff.can("property:read")


def test_roles_combine() -> None:
    both = build(roles={"analyst", "manager"})

    # manager brings the writes, analyst brings *:read — which does cover
    # billing:read, deliberately: "read everything" means everything.
    assert both.can("property:write")
    assert both.can("billing:read")
    # Neither role grants administration, and combining them must not invent it.
    assert not both.can("tenant:admin")


def test_an_unknown_role_grants_nothing_rather_than_raising() -> None:
    # A role added by a future migration should be inert here, not fatal.
    assert scopes_for_roles({"time_traveller"}) == frozenset()
    assert not build(roles={"time_traveller"}).can("property:read")


def test_property_scoping_narrows_to_what_is_granted() -> None:
    scoped = build(roles={"manager"}, property_ids={PROPERTY_A})

    assert scoped.scope_properties([PROPERTY_A, PROPERTY_B]) == frozenset({PROPERTY_A})


def test_requesting_only_inaccessible_properties_is_forbidden() -> None:
    scoped = build(roles={"manager"}, property_ids={PROPERTY_A})

    with pytest.raises(Forbidden) as raised:
        scoped.scope_properties([PROPERTY_B])
    assert raised.value.reason == "no_accessible_properties"


def test_all_properties_scope_covers_properties_created_later() -> None:
    # The point of 'all': a property added tomorrow is included without anyone
    # editing a membership.
    everything = build(roles={"owner"}, all_properties=True)

    assert everything.scope_properties([PROPERTY_B]) == frozenset({PROPERTY_B})
    assert everything.may_use_property(uuid.uuid4())


def test_an_empty_request_is_forbidden_even_with_all_properties() -> None:
    # Otherwise "give me nothing" silently succeeds and the caller believes it
    # asked for something.
    with pytest.raises(Forbidden):
        build(roles={"owner"}, all_properties=True).scope_properties([])


def test_a_principal_cannot_be_mutated_mid_request() -> None:
    principal = build(roles={"analyst"})

    with pytest.raises(AttributeError):
        principal.tenant_id = uuid.uuid4()  # type: ignore[misc]
