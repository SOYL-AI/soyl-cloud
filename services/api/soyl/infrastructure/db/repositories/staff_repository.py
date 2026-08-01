"""Staff membership, and the impersonation sessions staff can mint.

Deliberately small. There is no `grant()` here and there will not be one:
`soyl_app` holds `SELECT` on `core.staff_user` and nothing else (migration
007), so an insert would be refused by the grant even if someone wrote it.
Promotion runs through `scripts/grant_staff.py` as `soyl_migrator`, which means
no bug in this service can create a staff member.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text

from soyl.domain.identity.secrets import generate_token, hash_token

# Long enough to reproduce a support problem, short enough that a forgotten tab
# is not a standing grant. Staff can always mint another.
IMPERSONATION_LIFETIME = timedelta(minutes=30)


class StaffRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def is_staff(self) -> bool:
        """Whether this session's `app.staff_id` names a live staff member.

        Calls the same `core.is_staff()` the `staff_read` policies use, rather
        than re-implementing the lookup. One definition: if this returns true
        the policies will admit the reads, and if it returns false they will
        not, with no possibility of the two disagreeing.
        """
        result = await self._session.execute(text("SELECT core.is_staff()"))
        return bool(result.scalar_one())

    async def mint_impersonation(
        self,
        *,
        staff_id: uuid.UUID,
        target_user_id: uuid.UUID,
        tenant_id: uuid.UUID,
        ip: str | None,
        user_agent: str | None,
    ) -> tuple[uuid.UUID, str, datetime]:
        """Create a short-lived session acting as `target_user_id`.

        Returns the session id, the plaintext token **once**, and when it
        expires. Written as SQL rather than through `SessionRepository.create`
        on purpose: that method's signature has no room for a lifetime or an
        impersonator, and widening it would make an ordinary login one
        mistyped argument away from being an impersonation.
        """
        token = generate_token()
        expires_at = datetime.now(UTC) + IMPERSONATION_LIFETIME

        result = await self._session.execute(
            text(
                """
                INSERT INTO core.session
                    (user_id, active_tenant_id, token_hash, expires_at,
                     ip, user_agent, impersonated_by)
                VALUES
                    (:user_id, :tenant_id, :token_hash, :expires_at,
                     CAST(:ip AS inet), :user_agent, :staff_id)
                RETURNING id
                """
            ),
            {
                "user_id": str(target_user_id),
                "tenant_id": str(tenant_id),
                "token_hash": hash_token(token),
                "expires_at": expires_at,
                "ip": ip,
                "user_agent": user_agent,
                "staff_id": str(staff_id),
            },
        )
        return uuid.UUID(str(result.scalar_one())), token, expires_at

    async def target_user_for(self, tenant_id: uuid.UUID) -> tuple[uuid.UUID, str] | None:
        """The account an impersonation of this tenant should act as.

        The longest-standing owner, falling back to the longest-standing member
        of any role. Choosing deterministically matters: "impersonate this
        tenant" must land on the same account every time, or two staff members
        reproducing the same report see different data and conclude the bug is
        intermittent.

        Runs on a staff session — `core.membership` and `core.user_account` are
        both readable there, the first by the `staff_read` policy and the second
        because it has never been tenant-scoped.
        """
        result = await self._session.execute(
            text(
                """
                SELECT m.user_id, u.email
                FROM core.membership m
                JOIN core.user_account u ON u.id = m.user_id
                WHERE m.tenant_id = CAST(:tenant_id AS uuid)
                  AND u.deleted_at IS NULL
                  AND u.status = 'active'
                ORDER BY (m.role = 'owner') DESC, m.created_at
                LIMIT 1
                """
            ),
            {"tenant_id": str(tenant_id)},
        )
        row = result.first()
        if row is None:
            return None
        return uuid.UUID(str(row[0])), str(row[1])
