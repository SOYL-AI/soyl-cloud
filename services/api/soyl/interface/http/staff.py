"""The dependency every admin route hangs off.

`UPDATE.md` §11: *"Internal only, behind a `soyl_staff` role, every access
written to `audit.log`."* Both halves are here, and they are here rather than in
each route for the same reason `authenticated()` is one function: a second way
to reach admin data is how one of them ends up unaudited.

Three sessions, in order, because each answers a question the previous one
cannot:

1. **Untenanted** — resolve the bearer token. `core.session` has no tenant and
   the caller's identity is the *result* of this lookup.
2. **Staff** — set ``app.staff_id`` and ask Postgres ``core.is_staff()``. The
   403 and the row-level policies then share one definition of "is staff", so
   they cannot disagree.
3. **Untenanted again, committed on its own** — the audit row. Separate on
   purpose: if it shared the request's transaction, an admin request that 500s
   would roll back the record that it happened, and the accesses most worth
   having recorded are the ones that went wrong.
"""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Header, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy.sql import text

from soyl.domain.identity.principal import StaffPrincipal
from soyl.infrastructure.db.repositories import audit_repository as audit_actions
from soyl.infrastructure.db.repositories.audit_repository import AuditRepository
from soyl.infrastructure.db.repositories.identity_repository import SessionRepository
from soyl.infrastructure.db.repositories.staff_repository import StaffRepository
from soyl.infrastructure.db.session import staff_session, untenanted_session
from soyl.interface.http.authenticated import bearer_token
from soyl.interface.http.deps import get_session_factory


@dataclass(slots=True)
class StaffRequest:
    """A staff principal and a session that can read every tenant."""

    principal: StaffPrincipal
    session: AsyncSession


def client_ip(request: Request) -> str | None:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


async def _record(
    factory: async_sessionmaker[AsyncSession],
    request: Request,
    *,
    actor_id: uuid.UUID | None,
    outcome: audit_actions.Outcome,
) -> None:
    """One audit row, committed on its own transaction.

    ``tenant_id`` is null and that is correct rather than a gap: a staff read is
    not an event in any one tenant's history, and ``audit.log``'s policy would
    refuse a tenant id from a session that holds no tenant context anyway.
    Which tenant was being *looked at* is in the query string, which is
    recorded.
    """
    async with untenanted_session(factory) as session:
        await AuditRepository(session).record(
            action=audit_actions.ACTION_ADMIN_ACCESS,
            outcome=outcome,
            actor_kind="user" if actor_id else "anonymous",
            actor_id=actor_id,
            resource_kind="endpoint",
            resource_id=f"{request.method} {request.url.path}",
            ip=client_ip(request),
            user_agent=request.headers.get("user-agent"),
            # The query string is the useful half of "what did they look at":
            # which tenant, which date range, what they searched for.
            after={"query": request.url.query} if request.url.query else None,
        )


async def staff_authenticated(
    request: Request,
    factory: Annotated[async_sessionmaker[AsyncSession], Depends(get_session_factory)],
    authorization: Annotated[str | None, Header()] = None,
) -> AsyncIterator[StaffRequest]:
    token = bearer_token(authorization)
    if not token:
        await _record(factory, request, actor_id=None, outcome="denied")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    async with untenanted_session(factory) as lookup:
        row = await SessionRepository(lookup).get_active(token)
        if row is None:
            await _record(factory, request, actor_id=None, outcome="denied")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
            )
        # An impersonated session must never reach the admin panel. Otherwise
        # staff could impersonate a tenant and, from inside that session, mint
        # a further impersonation — a chain with no audit trail back to the
        # person who started it.
        if row.impersonated_by is not None:
            await _record(factory, request, actor_id=row.user_id, outcome="denied")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="An impersonated session cannot use the admin panel.",
            )
        user_id = row.user_id
        session_id = row.id

    async with staff_session(factory, user_id) as session:
        if not await StaffRepository(session).is_staff():
            await _record(factory, request, actor_id=user_id, outcome="denied")
            # 404, not 403. A signed-in customer poking at /v1/admin should not
            # learn that the path exists and that they merely lack a role.
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

        result = await session.execute(
            text("SELECT email FROM core.user_account WHERE id = CAST(:id AS uuid)"),
            {"id": str(user_id)},
        )
        email = str(result.scalar_one_or_none() or "")

        await _record(factory, request, actor_id=user_id, outcome="success")

        principal = StaffPrincipal(user_id=user_id, session_id=session_id, email=email)
        request.state.staff_principal = principal
        yield StaffRequest(principal=principal, session=session)


StaffReq = Annotated[StaffRequest, Depends(staff_authenticated)]
