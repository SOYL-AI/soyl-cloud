"""The authentication use cases.

Every flow that touches a credential lives here, so the rules that must hold
across all of them are visible in one file rather than distributed across six
route handlers.

The three rules:

1. **Nothing reveals whether an address has an account.** Signup, login and
   password-reset all answer identically for a known and an unknown address —
   in status code, body, *and* roughly in time. An enumeration oracle turns a
   password-database leak from elsewhere into a targeted attack on us.
2. **Every outcome is audited, including the failures.** A login that fails is
   more interesting than one that succeeds.
3. **An audit row must outlive the failure it records.** Raising rolls the
   transaction back, taking the audit row with it — so the failure paths below
   commit before they raise. Without that, the events most worth having
   (rejected logins, replayed reset links) are precisely the ones that never
   reach the log.
4. **Email failure never fails the operation.** An account is still created if
   the verification mail bounces; the link can be resent. The alternative is a
   signup funnel that breaks whenever Resend has a bad afternoon.
"""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text

from soyl.domain.identity.secrets import (
    PasswordTooLong,
    PasswordTooShort,
    hash_password,
    needs_rehash,
    verify_dummy_password,
    verify_password,
)
from soyl.infrastructure.db.repositories import audit_repository as audit_actions
from soyl.infrastructure.db.repositories.audit_repository import AuditRepository
from soyl.infrastructure.db.repositories.identity_repository import (
    CredentialTokenRepository,
    SessionRepository,
    UserRepository,
)
from soyl.infrastructure.email import (
    EmailNotConfigured,
    EmailSender,
    EmailSendFailed,
    password_reset_email,
    verification_email,
)

logger = logging.getLogger("soyl.auth")


class AuthError(Exception):
    """Something the caller may be told about."""

    def __init__(self, code: str, message: str) -> None:
        self.code = code
        super().__init__(message)


@dataclass(frozen=True, slots=True)
class RequestContext:
    """Where a request came from. Recorded on sessions and audit rows."""

    ip: str | None = None
    user_agent: str | None = None
    trace_id: str | None = None


@dataclass(frozen=True, slots=True)
class AuthenticatedUser:
    user_id: uuid.UUID
    email: str
    display_name: str | None
    session_token: str
    active_tenant_id: uuid.UUID | None
    email_verified: bool
    expires_at: datetime


class AuthService:
    def __init__(
        self,
        session: AsyncSession,
        *,
        sender: EmailSender,
        web_base_url: str,
    ) -> None:
        self._session = session
        self._users = UserRepository(session)
        self._sessions = SessionRepository(session)
        self._tokens = CredentialTokenRepository(session)
        self._audit = AuditRepository(session)
        self._sender = sender
        self._web = web_base_url.rstrip("/")

    # ── Signup ──────────────────────────────────────────────────────────────

    async def signup(
        self, *, email: str, password: str, display_name: str | None, context: RequestContext
    ) -> None:
        """Create an account and send a verification link.

        Returns nothing on purpose. A signup response that differs for an
        address that already exists is an enumeration oracle, so the caller
        gets the same 202 either way and the *email* carries the difference:
        a new account gets a verification link, an existing one gets nothing
        (they already know they have an account, and can use reset).
        """
        try:
            password_hash = hash_password(password)
        except (PasswordTooShort, PasswordTooLong) as exc:
            # The one thing we do reject openly. Password policy is not a
            # secret, and refusing silently would leave someone unable to sign
            # in with a password they believe they set.
            raise AuthError("weak_password", str(exc)) from exc

        existing = await self._users.get_by_email(email)
        if existing is not None:
            await self._audit.record(
                action=audit_actions.ACTION_SIGNUP,
                outcome="failure",
                actor_kind="anonymous",
                resource_kind="user_account",
                resource_id=email,
                ip=context.ip,
                user_agent=context.user_agent,
                trace_id=context.trace_id,
                after={"reason": "email_already_registered"},
            )
            return

        user = await self._users.create(
            email=email, password_hash=password_hash, display_name=display_name
        )
        token = await self._tokens.issue(user_id=user.id, kind="email_verify")

        await self._audit.record(
            action=audit_actions.ACTION_SIGNUP,
            outcome="success",
            actor_kind="user",
            actor_id=user.id,
            resource_kind="user_account",
            resource_id=str(user.id),
            ip=context.ip,
            user_agent=context.user_agent,
            trace_id=context.trace_id,
        )

        await self._send(
            to=email,
            build=verification_email,
            display_name=display_name,
            link=f"{self._web}/verify-email?token={token}",
            kind="verification",
        )

    # ── Login ───────────────────────────────────────────────────────────────

    async def login(
        self, *, email: str, password: str, context: RequestContext
    ) -> AuthenticatedUser:
        user = await self._users.get_by_email(email)

        if user is None:
            # Spend the same time as a real verification. Without this, "no
            # such user" returns in microseconds and "wrong password" in ~50ms.
            verify_dummy_password(password)
            await self._record_failed_login(email, context, reason="no_such_user")
            await self._commit_audit()
            raise AuthError("invalid_credentials", "Email or password is incorrect")

        if not verify_password(password, user.password_hash):
            await self._record_failed_login(email, context, reason="bad_password", user_id=user.id)
            await self._commit_audit()
            raise AuthError("invalid_credentials", "Email or password is incorrect")

        if user.status != "active":
            await self._record_failed_login(email, context, reason="suspended", user_id=user.id)
            await self._commit_audit()
            raise AuthError("invalid_credentials", "Email or password is incorrect")

        # The only moment the plaintext is available to re-hash with, so it is
        # the only moment parameters can be upgraded.
        if user.password_hash and needs_rehash(user.password_hash):
            await self._users.set_password_hash(user.id, hash_password(password))

        # app.user_id, not app.tenant_id: this is the lookup that decides which
        # tenant to activate, so it cannot already be scoped to one
        # (migration 003).
        await self._session.execute(
            text("SELECT set_config('app.user_id', :user_id, TRUE)"), {"user_id": str(user.id)}
        )
        memberships = await self._users.memberships(user.id)
        active_tenant_id = memberships[0].tenant_id if memberships else None

        row, token = await self._sessions.create(
            user_id=user.id,
            active_tenant_id=active_tenant_id,
            ip=context.ip,
            user_agent=context.user_agent,
        )

        await self._audit.record(
            action=audit_actions.ACTION_LOGIN,
            outcome="success",
            actor_id=user.id,
            tenant_id=active_tenant_id,
            resource_kind="session",
            resource_id=str(row.id),
            ip=context.ip,
            user_agent=context.user_agent,
            trace_id=context.trace_id,
        )

        return AuthenticatedUser(
            user_id=user.id,
            email=user.email,
            display_name=user.display_name,
            session_token=token,
            active_tenant_id=active_tenant_id,
            email_verified=user.email_verified_at is not None,
            expires_at=row.expires_at,
        )

    async def _record_failed_login(
        self,
        email: str,
        context: RequestContext,
        *,
        reason: str,
        user_id: uuid.UUID | None = None,
    ) -> None:
        await self._audit.record(
            action=audit_actions.ACTION_LOGIN,
            outcome="failure",
            actor_kind="user" if user_id else "anonymous",
            actor_id=user_id,
            resource_kind="user_account",
            resource_id=email,
            ip=context.ip,
            user_agent=context.user_agent,
            trace_id=context.trace_id,
            # The reason is recorded for us and never returned to the caller.
            after={"reason": reason},
        )

    # ── Logout ──────────────────────────────────────────────────────────────

    async def logout(self, *, token: str, context: RequestContext) -> None:
        """Idempotent. An already-revoked or unknown token is not an error.

        Logout must always appear to succeed: telling a caller their token was
        already invalid is both useless and a small oracle.
        """
        session = await self._sessions.get_active(token)
        if session is None:
            return

        await self._sessions.revoke(session.id)
        # tenant_id is deliberately omitted here even though the session had
        # one: this runs on an untenanted session, and audit.log's policy would
        # reject a row naming a tenant we are not scoped to. The savepoint in
        # AuditRepository would contain the failure, but the row would be lost.
        # The session id is recorded instead, which resolves to the tenant.
        await self._audit.record(
            action=audit_actions.ACTION_LOGOUT,
            outcome="success",
            actor_id=session.user_id,
            resource_kind="session",
            resource_id=str(session.id),
            ip=context.ip,
            user_agent=context.user_agent,
            trace_id=context.trace_id,
        )

    # ── Email verification ──────────────────────────────────────────────────

    async def verify_email(self, *, token: str, context: RequestContext) -> None:
        user_id = await self._tokens.consume(token=token, kind="email_verify")

        if user_id is None:
            await self._audit.record(
                action=audit_actions.ACTION_EMAIL_VERIFY,
                outcome="failure",
                actor_kind="anonymous",
                ip=context.ip,
                user_agent=context.user_agent,
                trace_id=context.trace_id,
                after={"reason": "invalid_or_expired"},
            )
            await self._commit_audit()
            raise AuthError("invalid_token", "That link is invalid or has expired")

        await self._users.mark_email_verified(user_id)
        await self._audit.record(
            action=audit_actions.ACTION_EMAIL_VERIFY,
            outcome="success",
            actor_id=user_id,
            resource_kind="user_account",
            resource_id=str(user_id),
            ip=context.ip,
            user_agent=context.user_agent,
            trace_id=context.trace_id,
        )

    # ── Password reset ──────────────────────────────────────────────────────

    async def request_password_reset(self, *, email: str, context: RequestContext) -> None:
        """Always succeeds from the caller's point of view.

        This endpoint is unauthenticated and takes an email address, so any
        difference in its behaviour is a public account-existence check.
        """
        user = await self._users.get_by_email(email)

        await self._audit.record(
            action=audit_actions.ACTION_PASSWORD_RESET_REQUEST,
            outcome="success" if user else "failure",
            actor_kind="user" if user else "anonymous",
            actor_id=user.id if user else None,
            resource_kind="user_account",
            resource_id=email,
            ip=context.ip,
            user_agent=context.user_agent,
            trace_id=context.trace_id,
            after=None if user else {"reason": "no_such_user"},
        )

        if user is None:
            return

        token = await self._tokens.issue(user_id=user.id, kind="password_reset")
        await self._send(
            to=email,
            build=password_reset_email,
            display_name=user.display_name,
            link=f"{self._web}/reset-password?token={token}",
            kind="password reset",
        )

    async def confirm_password_reset(
        self, *, token: str, new_password: str, context: RequestContext
    ) -> None:
        try:
            password_hash = hash_password(new_password)
        except (PasswordTooShort, PasswordTooLong) as exc:
            raise AuthError("weak_password", str(exc)) from exc

        user_id = await self._tokens.consume(token=token, kind="password_reset")
        if user_id is None:
            await self._audit.record(
                action=audit_actions.ACTION_PASSWORD_RESET_CONFIRM,
                outcome="failure",
                actor_kind="anonymous",
                ip=context.ip,
                user_agent=context.user_agent,
                trace_id=context.trace_id,
                after={"reason": "invalid_or_expired"},
            )
            await self._commit_audit()
            raise AuthError("invalid_token", "That link is invalid or has expired")

        await self._users.set_password_hash(user_id, password_hash)

        # Everything else signs out. Someone resetting a password they believe
        # was compromised is not helped by the attacker's session surviving.
        revoked = await self._sessions.revoke_all_for_user(user_id)

        # A reset also proves control of the mailbox, so it verifies the
        # address if that had not happened yet.
        await self._users.mark_email_verified(user_id)

        await self._audit.record(
            action=audit_actions.ACTION_PASSWORD_RESET_CONFIRM,
            outcome="success",
            actor_id=user_id,
            resource_kind="user_account",
            resource_id=str(user_id),
            ip=context.ip,
            user_agent=context.user_agent,
            trace_id=context.trace_id,
            after={"sessions_revoked": revoked},
        )

    async def _commit_audit(self) -> None:
        """Commit before raising, so the audit row survives the exception.

        Only ever called on a path that has written nothing but the audit row,
        so this commits exactly that. The caller's context manager will then
        see the exception and roll back a transaction that has nothing left in
        it.
        """
        await self._session.commit()

    # ── Email, which is allowed to fail ─────────────────────────────────────

    async def _send(
        self,
        *,
        to: str,
        build: object,
        display_name: str | None,
        link: str,
        kind: str,
    ) -> None:
        subject, text = build(display_name=display_name, link=link)  # type: ignore[operator]

        try:
            await self._sender.send(to=to, subject=subject, text=text)
        except EmailNotConfigured:
            # Local development. Log the link so the flow is still walkable.
            logger.warning("email not configured; %s link for %s: %s", kind, to, link)
        except EmailSendFailed:
            # Never fatal. The account exists and the link can be reissued.
            logger.exception("failed to send %s email to %s", kind, to)
