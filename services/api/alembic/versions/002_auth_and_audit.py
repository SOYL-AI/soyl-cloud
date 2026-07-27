"""Sessions, credential tokens, linked OAuth accounts, and the audit log.

Revision ID: 002
Revises: 001
Create Date: 2026-07-28

Three tables here are deliberately **not** tenant-scoped, for the same reason
``core.user_account`` is not: every one of them is looked up *before* a tenant
is known. A session is resolved from a cookie, a reset token from a link in an
email, an OAuth account from a provider callback — in all three cases the
tenant is a result of the lookup, not an input to it. A policy keyed on
``app.tenant_id`` would make them unreadable.

What protects them instead is that **nothing in them is guessable and nothing
in them is a secret at rest**: every token is stored as a SHA-256 hash, so a
dump of this database yields no usable session and no usable reset link.

``audit.log`` *is* tenant-scoped and does carry a policy, with one wrinkle
handled below: a failed login has no tenant, so the column is nullable and the
policy has to admit NULL rather than reject them.
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "002"
down_revision: str | None = "001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

APP_ROLE = "soyl_app"

# A NULL tenant_id means "not attributable to a tenant" — a failed login, a
# signup that has not chosen a tenant yet. `IS NOT DISTINCT FROM` treats NULL
# as a value rather than as unknown, so those rows are visible to a session
# with no tenant set and invisible to one that has a tenant. Plain `=` would
# make them invisible to everyone and silently unwritable.
AUDIT_PREDICATE = (
    "(tenant_id IS NOT DISTINCT FROM NULLIF(current_setting('app.tenant_id', TRUE), '')::uuid)"
)


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS audit")

    # ── Sessions ────────────────────────────────────────────────────────────
    op.create_table(
        "session",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        # The tenant the session is currently acting in. Nullable because a
        # user with no membership yet — straight after signup — still has a
        # valid session; they simply cannot reach tenant-scoped data with it.
        sa.Column("active_tenant_id", postgresql.UUID(as_uuid=True), nullable=True),
        # SHA-256 of the cookie value. The cookie itself is never stored, so a
        # database dump cannot be replayed as a live session.
        sa.Column("token_hash", sa.LargeBinary(length=32), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.Column(
            "last_seen_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ip", postgresql.INET(), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["core.user_account.id"],
            name="fk_session_user_id_user_account",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["active_tenant_id"],
            ["core.tenant.id"],
            name="fk_session_active_tenant_id_tenant",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_session"),
        sa.UniqueConstraint("token_hash", name="uq_session_token_hash"),
        schema="core",
        comment=(
            "Login sessions. NOT tenant-scoped and no RLS policy by design: a "
            "session is resolved from a cookie before any tenant is known, so a "
            "policy keyed on app.tenant_id would make it unreadable. token_hash "
            "is SHA-256 of the cookie value; the cookie is never stored."
        ),
    )
    op.create_index("ix_session_user_id", "session", ["user_id"], schema="core")
    # Reaping expired sessions is a scan over this.
    op.create_index("ix_session_expires_at", "session", ["expires_at"], schema="core")

    # ── Email verification and password reset ───────────────────────────────
    op.create_table(
        "credential_token",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("kind", sa.Text(), nullable=False),
        sa.Column("token_hash", sa.LargeBinary(length=32), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        # Single-use. Set the moment the token is accepted, in the same
        # transaction as whatever it authorised.
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.CheckConstraint(
            "kind IN ('email_verify', 'password_reset')", name="ck_credential_token_kind_is_known"
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["core.user_account.id"],
            name="fk_credential_token_user_id_user_account",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_credential_token"),
        sa.UniqueConstraint("token_hash", name="uq_credential_token_token_hash"),
        schema="core",
        comment=(
            "Email verification and password reset tokens, stored as SHA-256 "
            "hashes. NOT tenant-scoped: the token arrives from a link in an "
            "email and identifies the user, before any tenant is known."
        ),
    )
    op.create_index(
        "ix_credential_token_user_id_kind", "credential_token", ["user_id", "kind"], schema="core"
    )

    # ── Linked OAuth identities ─────────────────────────────────────────────
    op.create_table(
        "oauth_account",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("provider", sa.Text(), nullable=False),
        # The provider's stable subject identifier. Not the email: a Google
        # account can change its email, and matching on email is how account
        # takeover happens.
        sa.Column("provider_account_id", sa.Text(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.CheckConstraint("provider IN ('google')", name="ck_oauth_account_provider_is_known"),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["core.user_account.id"],
            name="fk_oauth_account_user_id_user_account",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_oauth_account"),
        sa.UniqueConstraint(
            "provider", "provider_account_id", name="uq_oauth_account_provider_provider_account_id"
        ),
        schema="core",
        comment=(
            "Linked third-party identities. NOT tenant-scoped: resolved from a "
            "provider callback before any tenant is known. Matched on the "
            "provider's subject id, never on email."
        ),
    )

    # ── Audit log ───────────────────────────────────────────────────────────
    # Partitioned monthly on occurred_at per UPDATE.md §7 and handbook §48.9.
    # PARTITION BY requires the partition key in the primary key, hence the
    # composite.
    op.execute(
        """
        CREATE TABLE audit.log (
            id            uuid        NOT NULL DEFAULT gen_random_uuid(),
            occurred_at   timestamptz NOT NULL DEFAULT now(),
            tenant_id     uuid        NULL,
            actor_kind    text        NOT NULL,
            actor_id      uuid        NULL,
            action        text        NOT NULL,
            resource_kind text        NULL,
            resource_id   text        NULL,
            outcome       text        NOT NULL,
            ip            inet        NULL,
            user_agent    text        NULL,
            trace_id      text        NULL,
            before        jsonb       NULL,
            after         jsonb       NULL,
            CONSTRAINT pk_log PRIMARY KEY (id, occurred_at),
            CONSTRAINT ck_log_actor_kind_is_known
                CHECK (actor_kind IN ('user', 'system', 'anonymous')),
            CONSTRAINT ck_log_outcome_is_known
                CHECK (outcome IN ('success', 'failure', 'denied'))
        ) PARTITION BY RANGE (occurred_at)
        """
    )
    op.execute(
        "COMMENT ON TABLE audit.log IS "
        "'Append-only. soyl_app is granted INSERT and SELECT and nothing else: "
        "an audit log the application can rewrite is not an audit log.'"
    )

    # A DEFAULT partition is a safety net, not the plan. Monthly partitions are
    # created ahead; if that ever fails, rows land here instead of the insert
    # erroring — and an auth event that cannot be written must not be able to
    # fail the login it is recording.
    op.execute("CREATE TABLE audit.log_default PARTITION OF audit.log DEFAULT")

    # Current month plus three, so a missed maintenance run is not an incident.
    op.execute(
        """
        DO $$
        DECLARE
            start_month date := date_trunc('month', now())::date;
            i int;
            from_date date;
            to_date date;
        BEGIN
            FOR i IN 0..3 LOOP
                from_date := start_month + (i || ' months')::interval;
                to_date   := start_month + ((i + 1) || ' months')::interval;
                EXECUTE format(
                    'CREATE TABLE audit.log_%s PARTITION OF audit.log '
                    'FOR VALUES FROM (%L) TO (%L)',
                    to_char(from_date, 'YYYY_MM'), from_date, to_date
                );
            END LOOP;
        END
        $$
        """
    )

    op.execute("CREATE INDEX ix_log_tenant_id_occurred_at ON audit.log (tenant_id, occurred_at DESC)")
    op.execute("CREATE INDEX ix_log_actor_id_occurred_at ON audit.log (actor_id, occurred_at DESC)")
    op.execute("CREATE INDEX ix_log_action_occurred_at ON audit.log (action, occurred_at DESC)")

    op.execute("ALTER TABLE audit.log ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE audit.log FORCE ROW LEVEL SECURITY")
    op.execute(
        f"CREATE POLICY tenant_isolation ON audit.log "
        f"FOR ALL USING {AUDIT_PREDICATE} WITH CHECK {AUDIT_PREDICATE}"
    )

    # ── Grants ──────────────────────────────────────────────────────────────
    for table in ("session", "credential_token", "oauth_account"):
        op.execute(f"GRANT SELECT, INSERT, UPDATE, DELETE ON core.{table} TO {APP_ROLE}")

    op.execute(f"GRANT USAGE ON SCHEMA audit TO {APP_ROLE}")
    # No UPDATE and no DELETE, deliberately. An audit log the application can
    # rewrite proves nothing.
    op.execute(f"GRANT SELECT, INSERT ON audit.log TO {APP_ROLE}")


def downgrade() -> None:
    op.execute("REVOKE ALL ON audit.log FROM soyl_app")
    op.execute("DROP TABLE audit.log CASCADE")
    op.execute("DROP SCHEMA IF EXISTS audit CASCADE")

    op.drop_table("oauth_account", schema="core")
    op.drop_index("ix_credential_token_user_id_kind", table_name="credential_token", schema="core")
    op.drop_table("credential_token", schema="core")
    op.drop_index("ix_session_expires_at", table_name="session", schema="core")
    op.drop_index("ix_session_user_id", table_name="session", schema="core")
    op.drop_table("session", schema="core")
