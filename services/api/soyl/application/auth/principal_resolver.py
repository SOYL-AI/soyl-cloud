"""Turning a session token into a `Principal`.

This is the join between everything M1 built and everything M2 built: the
session says who you are, the membership says which tenant and role, and the
result is written into the database transaction's ``app.tenant_id`` so that
row-level security does the rest.

**Claims are cached in Redis with a per-user version counter** (handbook
§23.1). The counter is what makes the cache safe: bumping a user's version
invalidates their claims within one request rather than within the cache's TTL,
so revoking a role does not leave a five-minute window in which it still works.

The cache is also entirely optional. If Redis is unreachable every lookup falls
through to Postgres and the system is slower, not broken — an availability
dependency on a cache is a bad trade for a login path.
"""

from __future__ import annotations

import json
import logging
import uuid
from dataclasses import dataclass

from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text

from soyl.domain.identity.principal import Principal, scopes_for_roles
from soyl.infrastructure.db.repositories.identity_repository import (
    SessionRepository,
    UserRepository,
)

logger = logging.getLogger("soyl.principal")


class NotAuthenticated(Exception):
    """No usable session. Always a 401 — logging in would help."""


class NoTenantSelected(Exception):
    """Authenticated, but the session has no tenant.

    A real state, not an error condition: a user who has signed up and not yet
    created a property is here. Routes that need a tenant return 409 with
    something actionable rather than 401, which would send them back to a login
    page they are already past.
    """


@dataclass(frozen=True, slots=True)
class _Claims:
    """The cacheable part. Deliberately excludes anything session-specific."""

    tenant_id: str
    roles: list[str]
    property_ids: list[str]
    has_all_properties: bool

    def to_json(self) -> str:
        return json.dumps(
            {
                "tenant_id": self.tenant_id,
                "roles": self.roles,
                "property_ids": self.property_ids,
                "has_all_properties": self.has_all_properties,
            }
        )

    @staticmethod
    def from_json(raw: str) -> _Claims:
        data = json.loads(raw)
        return _Claims(
            tenant_id=data["tenant_id"],
            roles=data["roles"],
            property_ids=data["property_ids"],
            has_all_properties=data["has_all_properties"],
        )


def _version_key(user_id: uuid.UUID) -> str:
    return f"claims:version:{user_id}"


def _claims_key(user_id: uuid.UUID, tenant_id: uuid.UUID, version: int) -> str:
    # The version is part of the key rather than something to invalidate, so a
    # bump orphans the old entry instead of racing a delete against a write.
    return f"claims:{user_id}:{tenant_id}:v{version}"


async def bump_claims_version(redis: Redis, user_id: uuid.UUID) -> None:
    """Invalidate a user's cached claims immediately.

    Call after any change to membership, role or property scope. Failure is
    swallowed *loudly*: a stale cache is a real problem, but taking the write
    down because Redis blinked is a worse one, and the TTL bounds the damage.
    """
    try:
        await redis.incr(_version_key(user_id))
    except Exception:
        logger.exception("could not bump claims version for %s", user_id)


class PrincipalResolver:
    def __init__(
        self,
        session: AsyncSession,
        redis: Redis,
        *,
        cache_seconds: int,
    ) -> None:
        self._session = session
        self._redis = redis
        self._cache_seconds = cache_seconds
        self._sessions = SessionRepository(session)
        self._users = UserRepository(session)

    async def resolve(self, token: str) -> Principal:
        """Session token in, `Principal` out. Raises rather than returning None.

        Every failure here is a 401 and none of them says which failure it was.
        """
        row = await self._sessions.get_active(token)
        if row is None:
            raise NotAuthenticated

        if row.active_tenant_id is None:
            raise NoTenantSelected

        claims = await self._claims_for(row.user_id, row.active_tenant_id)
        if claims is None:
            # The session names a tenant the user is no longer a member of —
            # their membership was revoked while they were signed in. Not
            # authenticated *for this tenant*, and the session should not
            # silently fall back to another one.
            raise NotAuthenticated

        return Principal(
            user_id=row.user_id,
            tenant_id=uuid.UUID(claims.tenant_id),
            session_id=row.id,
            roles=frozenset(claims.roles),
            scopes=scopes_for_roles(claims.roles),
            property_ids=frozenset(uuid.UUID(p) for p in claims.property_ids),
            has_all_properties=claims.has_all_properties,
        )

    async def _claims_for(self, user_id: uuid.UUID, tenant_id: uuid.UUID) -> _Claims | None:
        version = await self._version(user_id)

        if version is not None:
            cached = await self._read_cache(user_id, tenant_id, version)
            if cached is not None:
                return cached

        claims = await self._load_claims(user_id, tenant_id)

        if claims is not None and version is not None:
            await self._write_cache(user_id, tenant_id, version, claims)

        return claims

    async def _load_claims(self, user_id: uuid.UUID, tenant_id: uuid.UUID) -> _Claims | None:
        # Readable only because migration 003 added the self-access policy and
        # the caller opened a user-scoped session. Without both, this returns
        # nothing and the user appears to belong to no tenant at all.
        await self._session.execute(
            text("SELECT set_config('app.user_id', :user_id, TRUE)"), {"user_id": str(user_id)}
        )
        memberships = await self._users.memberships(user_id)
        membership = next((m for m in memberships if m.tenant_id == tenant_id), None)
        if membership is None:
            return None

        has_all = membership.property_scope == "all"
        property_ids = (
            [] if has_all else await self._users.membership_property_ids(membership.id)
        )

        return _Claims(
            tenant_id=str(tenant_id),
            roles=[membership.role],
            property_ids=[str(p) for p in property_ids],
            has_all_properties=has_all,
        )

    # ── Cache, which is allowed to be absent ────────────────────────────────

    async def _version(self, user_id: uuid.UUID) -> int | None:
        try:
            raw = await self._redis.get(_version_key(user_id))
            if raw is None:
                # First sight of this user. Start at 1 rather than 0 so the key
                # always exists and a later INCR cannot race its creation.
                await self._redis.set(_version_key(user_id), 1, nx=True)
                raw = await self._redis.get(_version_key(user_id)) or "1"
            return int(raw)
        except Exception:
            logger.warning("claims cache unavailable; falling through to Postgres", exc_info=True)
            return None

    async def _read_cache(
        self, user_id: uuid.UUID, tenant_id: uuid.UUID, version: int
    ) -> _Claims | None:
        try:
            raw = await self._redis.get(_claims_key(user_id, tenant_id, version))
            return _Claims.from_json(raw) if raw else None
        except Exception:
            return None

    async def _write_cache(
        self, user_id: uuid.UUID, tenant_id: uuid.UUID, version: int, claims: _Claims
    ) -> None:
        try:
            await self._redis.set(
                _claims_key(user_id, tenant_id, version),
                claims.to_json(),
                ex=self._cache_seconds,
            )
        except Exception:
            logger.debug("could not cache claims for %s", user_id, exc_info=True)
