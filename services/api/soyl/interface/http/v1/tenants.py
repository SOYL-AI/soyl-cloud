"""Tenant and property routes.

Tenant creation is the awkward one, and it is worth understanding why rather
than working around it. `core.tenant`'s RLS policy keys on ``id``, not
``tenant_id`` — the tenant *is* the row. So a session can only insert a tenant
whose id it is already scoped to, which means the flow has to be:

    generate the UUID → open a session scoped to it → insert

That looks backwards the first time you see it. It is also exactly the property
we want: **nobody can create a tenant row on another tenant's behalf**, because
doing so would require already holding that tenant's context.
"""

from __future__ import annotations

import re
import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from pydantic import BaseModel, ConfigDict, Field
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy.sql import text

from soyl.application.auth.principal_resolver import bump_claims_version
from soyl.infrastructure.db.repositories import audit_repository as audit_actions
from soyl.infrastructure.db.repositories.audit_repository import AuditRepository
from soyl.infrastructure.db.repositories.identity_repository import SessionRepository
from soyl.infrastructure.db.repositories.property_repository import PropertyRepository
from soyl.infrastructure.db.repositories.tenant_repository import TenantRepository
from soyl.infrastructure.db.session import tenant_session, untenanted_session
from soyl.interface.http.authenticated import AuthedRequest, bearer_token
from soyl.interface.http.deps import get_redis, get_session_factory

router = APIRouter(prefix="/v1", tags=["tenancy"])

SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


class NotAuthenticatedResponse(HTTPException):
    def __init__(self) -> None:
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")


def require_bearer(authorization: Annotated[str | None, Header()] = None) -> str:
    """Reject an anonymous caller before the body is validated.

    Route dependencies are solved ahead of body parsing, so without this an
    unauthenticated POST gets a 422 describing the schema it should have sent —
    a small but free gift to someone mapping the API.
    """
    token = bearer_token(authorization)
    if not token:
        raise NotAuthenticatedResponse()
    return token


class TenantCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=200)
    slug: str = Field(min_length=2, max_length=63)
    country: str = Field(min_length=2, max_length=2)
    timezone: str = Field(default="Asia/Kolkata", max_length=64)
    base_currency: str = Field(default="INR", min_length=3, max_length=3)


class TenantOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    country: str
    timezone: str
    base_currency: str
    created_at: datetime


class PropertyCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=200)
    rooms_total: int = Field(default=0, ge=0, le=100_000)
    timezone: str = Field(default="Asia/Kolkata", max_length=64)


class PropertyOut(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    name: str
    rooms_total: int
    timezone: str
    created_at: datetime


@router.post("/tenants", status_code=status.HTTP_201_CREATED, response_model=TenantOut)
async def create_tenant(
    payload: TenantCreate,
    request: Request,
    factory: Annotated[async_sessionmaker[AsyncSession], Depends(get_session_factory)],
    redis: Annotated[Redis, Depends(get_redis)],
    token: Annotated[str, Depends(require_bearer)],
) -> TenantOut:
    """Create a tenant and make the caller its owner.

    Deliberately *not* behind `authenticated`: that dependency requires an
    active tenant, and someone creating their first one has none. It resolves
    the session by hand instead, which is the one place in the codebase that is
    allowed to.
    """
    if not SLUG_PATTERN.match(payload.slug):
        raise HTTPException(
            status_code=422,
            detail="Slug must be lowercase letters, digits and single hyphens",
        )

    async with untenanted_session(factory) as lookup:
        session_row = await SessionRepository(lookup).get_active(token)
        if session_row is None:
            raise NotAuthenticatedResponse()
        user_id = session_row.user_id
        session_id = session_row.id

    # Generated here, before any database work, because the session that
    # inserts the row must already be scoped to it.
    tenant_id = uuid.uuid4()

    async with tenant_session(factory, tenant_id) as session:
        await session.execute(
            text(
                "INSERT INTO core.tenant (id, name, slug, country, timezone, base_currency) "
                "VALUES (:id, :name, :slug, :country, :timezone, :currency)"
            ),
            {
                "id": tenant_id,
                "name": payload.name,
                "slug": payload.slug,
                "country": payload.country.upper(),
                "timezone": payload.timezone,
                "currency": payload.base_currency.upper(),
            },
        )
        # 'all' scope: every property in this tenant, including ones created
        # later. An owner who has to be granted each new property is an owner
        # who will be locked out of their own hotel on a Tuesday.
        await session.execute(
            text(
                "INSERT INTO core.membership (tenant_id, user_id, role, property_scope) "
                "VALUES (:tenant_id, :user_id, 'owner', 'all')"
            ),
            {"tenant_id": tenant_id, "user_id": user_id},
        )
        await AuditRepository(session).record(
            action=audit_actions.ACTION_TENANT_CREATE,
            outcome="success",
            actor_id=user_id,
            tenant_id=tenant_id,
            resource_kind="tenant",
            resource_id=str(tenant_id),
            ip=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
        created = await TenantRepository(session).get(tenant_id)

    async with untenanted_session(factory) as session:
        # The session was created before this membership existed, so it still
        # points at no tenant. Without this the caller is an owner who cannot
        # reach anything until they sign in again.
        await SessionRepository(session).set_active_tenant(session_id, tenant_id)

    # The user's claims just changed. Bump before returning, so the very next
    # request sees the membership rather than a cached absence.
    await bump_claims_version(redis, user_id)

    assert created is not None
    return TenantOut(
        id=created.id,
        name=created.name,
        slug=created.slug,
        country=created.country,
        timezone=created.timezone,
        base_currency=created.base_currency,
        created_at=created.created_at,
    )


@router.get("/tenants/current", response_model=TenantOut)
async def current_tenant(authed: AuthedRequest) -> TenantOut:
    authed.require("property:read")

    tenant = await TenantRepository(authed.session).get(authed.principal.tenant_id)
    if tenant is None:
        # RLS returned nothing for a tenant the principal claims to be in.
        # Should be unreachable; if it happens, it is a policy bug and must not
        # be papered over with an empty response.
        raise HTTPException(status_code=404, detail="Tenant not found")

    return TenantOut(
        id=tenant.id,
        name=tenant.name,
        slug=tenant.slug,
        country=tenant.country,
        timezone=tenant.timezone,
        base_currency=tenant.base_currency,
        created_at=tenant.created_at,
    )


@router.post("/properties", status_code=status.HTTP_201_CREATED, response_model=PropertyOut)
async def create_property(
    payload: PropertyCreate, request: Request, authed: AuthedRequest
) -> PropertyOut:
    authed.require("property:write")

    created = await PropertyRepository(authed.session).create(
        tenant_id=authed.principal.tenant_id,
        name=payload.name,
        rooms_total=payload.rooms_total,
        timezone=payload.timezone,
    )
    await AuditRepository(authed.session).record(
        action=audit_actions.ACTION_PROPERTY_CREATE,
        outcome="success",
        actor_id=authed.principal.user_id,
        tenant_id=authed.principal.tenant_id,
        resource_kind="property",
        resource_id=str(created.id),
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return PropertyOut(
        id=created.id,
        tenant_id=created.tenant_id,
        name=created.name,
        rooms_total=created.rooms_total,
        timezone=created.timezone,
        created_at=created.created_at,
    )


@router.get("/properties", response_model=list[PropertyOut])
async def list_properties(authed: AuthedRequest) -> list[PropertyOut]:
    """Returns this tenant's properties, and only this tenant's.

    There is no ``WHERE tenant_id`` in the repository behind this — the session
    carries the tenant and Postgres applies it. The acceptance test calls this
    as tenant B and asserts it cannot see tenant A's rows.
    """
    authed.require("property:read")

    properties = await PropertyRepository(authed.session).list_active()
    return [
        PropertyOut(
            id=p.id,
            tenant_id=p.tenant_id,
            name=p.name,
            rooms_total=p.rooms_total,
            timezone=p.timezone,
            created_at=p.created_at,
        )
        for p in properties
    ]


@router.get("/properties/{property_id}", response_model=PropertyOut)
async def get_property(property_id: uuid.UUID, authed: AuthedRequest) -> PropertyOut:
    authed.require("property:read")

    found = await PropertyRepository(authed.session).get(property_id)
    if found is None:
        # 404 for both "does not exist" and "belongs to another tenant". A 403
        # would confirm the id is real, which is a cross-tenant existence
        # oracle over a guessable-shaped identifier.
        raise HTTPException(status_code=404, detail="Property not found")

    return PropertyOut(
        id=found.id,
        tenant_id=found.tenant_id,
        name=found.name,
        rooms_total=found.rooms_total,
        timezone=found.timezone,
        created_at=found.created_at,
    )
