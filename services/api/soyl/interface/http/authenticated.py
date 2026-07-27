"""The dependency every tenant-scoped route hangs off.

One function, because there must be exactly one way to get a database session
on an authenticated route — and that way sets ``app.tenant_id`` before handing
it over. A second way is how a route ends up querying without a tenant context.

The ordering is the important part:

1. Resolve the session token on an **untenanted** session. It has to be:
   `core.session` has no tenant column and the tenant is a *result* of this
   lookup, not an input to it.
2. Open a **tenanted** session for the actual work, with ``app.tenant_id``
   already set from the resolved principal.

Two transactions rather than one. The alternative is a single transaction that
starts untenanted and has the setting applied partway through, which means any
query written above that line silently escapes RLS.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Header, HTTPException, Request, status
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from soyl.application.auth.principal_resolver import (
    NotAuthenticated,
    NoTenantSelected,
    PrincipalResolver,
)
from soyl.domain.identity.principal import Forbidden, Principal
from soyl.infrastructure.db.session import tenant_session, untenanted_session
from soyl.interface.http.deps import get_redis, get_session_factory, get_settings_dep
from soyl.settings import Settings


@dataclass(slots=True)
class AuthenticatedRequest:
    """A principal and a session already scoped to their tenant."""

    principal: Principal
    session: AsyncSession

    def require(self, scope: str) -> None:
        """Raises 403, not 401. Logging in again would not help."""
        try:
            self.principal.require(scope)
        except Forbidden as exc:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing scope: {exc.scope}" if exc.scope else "Forbidden",
            ) from exc


def bearer_token(authorization: str | None) -> str:
    if authorization and authorization.lower().startswith("bearer "):
        return authorization[7:].strip()
    return ""


async def authenticated(
    request: Request,
    factory: Annotated[async_sessionmaker[AsyncSession], Depends(get_session_factory)],
    redis: Annotated[Redis, Depends(get_redis)],
    settings: Annotated[Settings, Depends(get_settings_dep)],
    authorization: Annotated[str | None, Header()] = None,
) -> AsyncIterator[AuthenticatedRequest]:
    token = bearer_token(authorization)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    async with untenanted_session(factory) as lookup:
        resolver = PrincipalResolver(
            lookup, redis, cache_seconds=settings.claims_cache_seconds
        )
        try:
            principal = await resolver.resolve(token)
        except NoTenantSelected as exc:
            # 409, not 401. They are signed in; they have not finished
            # onboarding. Sending them to a login page they are already past is
            # a loop that cannot terminate.
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="No tenant selected. Create a property to finish setting up.",
            ) from exc
        except NotAuthenticated as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
            ) from exc

    request.state.principal = principal

    async with tenant_session(factory, principal.tenant_id) as session:
        yield AuthenticatedRequest(principal=principal, session=session)


AuthedRequest = Annotated[AuthenticatedRequest, Depends(authenticated)]
