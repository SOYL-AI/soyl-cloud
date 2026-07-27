"""Writing to the audit log.

`soyl_app` holds INSERT and SELECT and nothing else, so there is deliberately
no update or delete method here — not as a convention, but because the grant
would refuse one.

The single rule this module enforces: **a failed audit write must never fail
the operation it was recording.** A login that succeeds and then 500s because
the log was unreachable is strictly worse than a login that succeeds
unrecorded. Failures are logged to stderr, loudly, where the platform collects
them.
"""

from __future__ import annotations

import logging
import uuid
from typing import Literal

from sqlalchemy import insert
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from soyl.infrastructure.db.models.audit import AuditLog

logger = logging.getLogger("soyl.audit")

Outcome = Literal["success", "failure", "denied"]
ActorKind = Literal["user", "system", "anonymous"]

# The auth vocabulary. A closed set so a typo is a lint error rather than an
# event nobody can search for later.
ACTION_SIGNUP = "auth.signup"
ACTION_LOGIN = "auth.login"
ACTION_LOGOUT = "auth.logout"
ACTION_EMAIL_VERIFY = "auth.email_verify"
ACTION_PASSWORD_RESET_REQUEST = "auth.password_reset_request"  # noqa: S105 - an action name, not a secret
ACTION_PASSWORD_RESET_CONFIRM = "auth.password_reset_confirm"  # noqa: S105 - an action name, not a secret
ACTION_SESSION_DENIED = "auth.session_denied"
ACTION_TENANT_CREATE = "tenant.create"
ACTION_PROPERTY_CREATE = "property.create"
ACTION_PERMISSION_DENIED = "authz.denied"


class AuditRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def record(
        self,
        *,
        action: str,
        outcome: Outcome,
        actor_kind: ActorKind = "user",
        actor_id: uuid.UUID | None = None,
        tenant_id: uuid.UUID | None = None,
        resource_kind: str | None = None,
        resource_id: str | None = None,
        ip: str | None = None,
        user_agent: str | None = None,
        trace_id: str | None = None,
        before: dict[str, object] | None = None,
        after: dict[str, object] | None = None,
    ) -> None:
        """Append one row. Never raises.

        `before`/`after` must not contain a password, a token, or anything else
        that would make the audit log a place worth stealing. Callers pass
        identifiers and state names, not payloads.
        """
        try:
            await self._session.execute(
                insert(AuditLog).values(
                    action=action,
                    outcome=outcome,
                    actor_kind=actor_kind,
                    actor_id=actor_id,
                    tenant_id=tenant_id,
                    resource_kind=resource_kind,
                    resource_id=resource_id,
                    ip=ip,
                    user_agent=user_agent,
                    trace_id=trace_id,
                    before=before,
                    after=after,
                )
            )
        except SQLAlchemyError:
            logger.exception(
                "audit write failed action=%s outcome=%s actor=%s", action, outcome, actor_id
            )
