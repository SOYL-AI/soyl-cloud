"""Writing to the audit log.

`soyl_app` holds INSERT and SELECT and nothing else, so there is deliberately
no update or delete method here — not as a convention, but because the grant
would refuse one.

The single rule this module enforces: **a failed audit write must never fail
the operation it was recording.** A login that succeeds and then 500s because
the log was unreachable is strictly worse than a login that succeeds
unrecorded.

Catching the exception is not enough to keep that promise, and the first
version of this file did not. A failed INSERT aborts the whole Postgres
transaction, so swallowing the error left a poisoned transaction whose COMMIT
silently rolled back everything the caller had already done — in practice, a
logout that revoked nothing. The write therefore runs inside a SAVEPOINT, so a
failure rolls back the audit row and nothing else.
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
# Internal staff. `UPDATE.md` §11 requires every admin access to be recorded,
# including the refused ones — a customer probing /v1/admin is exactly the row
# worth having. Written with a null tenant_id: a staff read is not an event in
# any one tenant's history.
ACTION_ADMIN_ACCESS = "admin.access"
ACTION_IMPERSONATE_START = "admin.impersonate_start"
ACTION_IMPERSONATE_END = "admin.impersonate_end"
ACTION_DOCUMENT_REPROCESS = "admin.document_reprocess"


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
            # SAVEPOINT. Without it a rejected insert — a policy violation, a
            # missing partition — aborts the caller's transaction too, and the
            # operation being audited is silently undone at commit.
            async with self._session.begin_nested():
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
