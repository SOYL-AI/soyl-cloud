"""Users, sessions and credential tokens.

Unlike the tenant-scoped repositories, these run on an **untenanted** session:
every lookup here happens before a tenant is known. That is not a weakening of
the isolation model — none of these tables holds tenant data. The moment a
tenant *is* known, the caller switches to a tenant session and RLS takes over.

Nothing in this module accepts or returns a raw secret except at the moment one
is created. Everything stored and compared is a digest.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from typing import Any, cast

from sqlalchemy import select, update
from sqlalchemy.engine import CursorResult
from sqlalchemy.ext.asyncio import AsyncSession

from soyl.domain.identity.secrets import generate_token, hash_token
from soyl.infrastructure.db.models.core import Membership, MembershipProperty, UserAccount
from soyl.infrastructure.db.models.identity import CredentialToken, Session

SESSION_LIFETIME = timedelta(days=30)
EMAIL_VERIFY_LIFETIME = timedelta(hours=24)
# Deliberately shorter than verification. A reset link is a live credential:
# anyone holding it can take the account.
PASSWORD_RESET_LIFETIME = timedelta(hours=1)


def _now() -> datetime:
    return datetime.now(UTC)


class UserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_email(self, email: str) -> UserAccount | None:
        # citext, so this is case-insensitive in the database rather than by
        # lower() here — one place for the rule.
        result = await self._session.execute(
            select(UserAccount).where(
                UserAccount.email == email, UserAccount.deleted_at.is_(None)
            )
        )
        return result.scalar_one_or_none()

    async def get(self, user_id: uuid.UUID) -> UserAccount | None:
        result = await self._session.execute(
            select(UserAccount).where(
                UserAccount.id == user_id, UserAccount.deleted_at.is_(None)
            )
        )
        return result.scalar_one_or_none()

    async def create(
        self, *, email: str, password_hash: str | None, display_name: str | None
    ) -> UserAccount:
        user = UserAccount(email=email, password_hash=password_hash, display_name=display_name)
        self._session.add(user)
        await self._session.flush()
        return user

    async def set_password_hash(self, user_id: uuid.UUID, password_hash: str) -> None:
        await self._session.execute(
            update(UserAccount).where(UserAccount.id == user_id).values(password_hash=password_hash)
        )

    async def mark_email_verified(self, user_id: uuid.UUID) -> None:
        await self._session.execute(
            update(UserAccount)
            .where(UserAccount.id == user_id, UserAccount.email_verified_at.is_(None))
            .values(email_verified_at=_now())
        )

    async def memberships(self, user_id: uuid.UUID) -> list[Membership]:
        """Every tenant this user belongs to.

        Runs untenanted on purpose: this is the query that *determines* which
        tenants are available, so it cannot itself be tenant-scoped. RLS on
        core.membership would return nothing here — which is why the caller
        must use an untenanted session and why this method is the one place
        allowed to see across tenants. It returns memberships, never tenant
        data.
        """
        result = await self._session.execute(
            select(Membership).where(Membership.user_id == user_id).order_by(Membership.created_at)
        )
        return list(result.scalars().all())

    async def membership_property_ids(self, membership_id: uuid.UUID) -> list[uuid.UUID]:
        result = await self._session.execute(
            select(MembershipProperty.property_id).where(
                MembershipProperty.membership_id == membership_id
            )
        )
        return list(result.scalars().all())


class SessionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self,
        *,
        user_id: uuid.UUID,
        active_tenant_id: uuid.UUID | None,
        ip: str | None,
        user_agent: str | None,
    ) -> tuple[Session, str]:
        """Returns the row and the **plaintext token, exactly once**.

        The token is never stored and cannot be recovered afterwards. If the
        caller loses it, the session is unreachable and must be recreated.
        """
        token = generate_token()
        row = Session(
            user_id=user_id,
            active_tenant_id=active_tenant_id,
            token_hash=hash_token(token),
            expires_at=_now() + SESSION_LIFETIME,
            ip=ip,
            user_agent=user_agent,
        )
        self._session.add(row)
        await self._session.flush()
        return row, token

    async def get_active(self, token: str) -> Session | None:
        """Resolve a live session from its token.

        Expiry and revocation are checked in SQL rather than in Python so that
        an expired session cannot be resurrected by a caller that forgets to
        look at the columns.
        """
        result = await self._session.execute(
            select(Session).where(
                Session.token_hash == hash_token(token),
                Session.revoked_at.is_(None),
                Session.expires_at > _now(),
            )
        )
        return result.scalar_one_or_none()

    async def touch(self, session_id: uuid.UUID) -> None:
        await self._session.execute(
            update(Session).where(Session.id == session_id).values(last_seen_at=_now())
        )

    async def set_active_tenant(self, session_id: uuid.UUID, tenant_id: uuid.UUID) -> None:
        await self._session.execute(
            update(Session).where(Session.id == session_id).values(active_tenant_id=tenant_id)
        )

    async def revoke(self, session_id: uuid.UUID) -> None:
        await self._session.execute(
            update(Session)
            .where(Session.id == session_id, Session.revoked_at.is_(None))
            .values(revoked_at=_now())
        )

    async def revoke_all_for_user(self, user_id: uuid.UUID) -> int:
        """Used after a password reset.

        A reset that leaves existing sessions alive does not lock anyone out —
        which is the entire reason someone resets a password they think has
        been compromised.
        """
        result = await self._session.execute(
            update(Session)
            .where(Session.user_id == user_id, Session.revoked_at.is_(None))
            .values(revoked_at=_now())
        )
        # Result is typed loosely in SQLAlchemy 2.x; an UPDATE always returns a
        # CursorResult, which is where rowcount lives.
        return int(cast("CursorResult[Any]", result).rowcount)


class CredentialTokenRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def issue(self, *, user_id: uuid.UUID, kind: str) -> str:
        """Issue a single-use token, invalidating any earlier one of its kind.

        Without the invalidation, a user who clicks "resend" three times has
        three live reset links, and the oldest email is the one most likely to
        be sitting in a compromised mailbox.
        """
        await self._session.execute(
            update(CredentialToken)
            .where(
                CredentialToken.user_id == user_id,
                CredentialToken.kind == kind,
                CredentialToken.consumed_at.is_(None),
            )
            .values(consumed_at=_now())
        )

        lifetime = EMAIL_VERIFY_LIFETIME if kind == "email_verify" else PASSWORD_RESET_LIFETIME
        token = generate_token()
        self._session.add(
            CredentialToken(
                user_id=user_id,
                kind=kind,
                token_hash=hash_token(token),
                expires_at=_now() + lifetime,
            )
        )
        await self._session.flush()
        return token

    async def consume(self, *, token: str, kind: str) -> uuid.UUID | None:
        """Redeem a token, returning the user it belonged to.

        The UPDATE carries the whole predicate — unconsumed, unexpired, right
        kind — so redemption is atomic. Reading the row first and then marking
        it lets two concurrent requests both succeed, which on a reset token
        means two people setting the password.
        """
        result = await self._session.execute(
            update(CredentialToken)
            .where(
                CredentialToken.token_hash == hash_token(token),
                CredentialToken.kind == kind,
                CredentialToken.consumed_at.is_(None),
                CredentialToken.expires_at > _now(),
            )
            .values(consumed_at=_now())
            .returning(CredentialToken.user_id)
        )
        return result.scalar_one_or_none()
