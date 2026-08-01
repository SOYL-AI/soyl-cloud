"""Internal staff access, and the impersonation column.

Revision ID: 007
Revises: 006
Create Date: 2026-08-02

`UPDATE.md` §11 wants an admin panel over **every** tenant: a questions list
filterable by tenant, cost per tenant per day, a signup funnel. Those are
cross-tenant aggregates by definition, and every table they read is under
`ENABLE` + `FORCE` row level security keyed on one `app.tenant_id`.

So M6 has to answer a question the first six migrations were built to make
hard: *how does anyone legitimately read across tenants?* Three answers were
available and two of them are wrong.

**Wrong: a role with `BYPASSRLS`.** It works, and it moves the enforcement
point out of Postgres and into "the admin route remembered to filter". That is
precisely the retrofit `UPDATE.md` §6.1 exists to prevent. A missing `WHERE`
in an admin query would then be a cross-tenant leak rather than an empty page.

**Wrong: give staff a membership in every tenant.** It reuses the existing path
and it makes staff indistinguishable from a customer in the audit log, which
destroys the one property that makes internal access acceptable.

**Right: a second, additive policy.** Postgres OR's permissive policies
together, so `staff_read` alongside `tenant_isolation` widens `SELECT` without
touching it. Enforcement stays in the database, and the widening is:

- **read-only** — `FOR SELECT` only, so `tenant_isolation` remains the sole
  policy governing INSERT, UPDATE and DELETE. Staff cannot write a tenant's
  data through this path at all, whatever the application does.
- **not forgeable by setting a variable** — the predicate is
  `core.is_staff()`, which looks `app.staff_id` up in `core.staff_user`. An
  arbitrary uuid in that setting matches no row and grants nothing.
- **revocable in one write** — `revoked_at` on the staff row takes effect on
  the next statement, everywhere, with no cache to wait out.
- **not grantable by the application** — `soyl_app` holds `SELECT` on
  `core.staff_user` and nothing else. Promoting someone to staff requires
  `soyl_migrator`, i.e. `scripts/grant_staff.py`. An application bug cannot
  promote an attacker to staff, because the grant to do so does not exist.

The policies are created from `pg_policies` rather than a hand-written list, so
this migration cannot miss a table that already has `tenant_isolation`. Future
tables are a different risk, and a list here would not catch those either —
`tests/integration/test_staff_access.py::test_every_tenant_scoped_table_has_a_staff_policy`
is what catches those, by asserting the two policy sets stay equal.
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op

revision: str = "007"
down_revision: str | None = "006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

APP_ROLE = "soyl_app"

# Which staff member is reading. Deliberately a *different* setting from
# `app.user_id`: a signed-in staff member browsing their own tenant must not
# silently acquire cross-tenant reads, and would if one variable meant both.
STAFF_SETTING = "app.staff_id"


def upgrade() -> None:
    # ── Who is staff ────────────────────────────────────────────────────────
    op.execute(
        """
        CREATE TABLE core.staff_user (
            user_id    uuid        PRIMARY KEY
                                   REFERENCES core.user_account(id) ON DELETE CASCADE,
            granted_at timestamptz NOT NULL DEFAULT now(),
            -- Null for the first one, who has nobody to have been granted by.
            granted_by uuid        NULL REFERENCES core.user_account(id) ON DELETE SET NULL,
            -- Why this person has it. Free text on purpose: the useful answer
            -- is a sentence, not an enum.
            reason     text        NULL,
            revoked_at timestamptz NULL
        )
        """
    )
    op.execute(
        "COMMENT ON TABLE core.staff_user IS "
        "'Internal staff. soyl_app holds SELECT and nothing else: promotion "
        "requires soyl_migrator, so no application bug can grant it.'"
    )

    # ENABLE without FORCE — the **only** table in this database where that is
    # correct, so it needs justifying against migration 001's rule.
    #
    # FORCE exists so that the owner, `soyl_migrator`, is subject to the tenant
    # policies too; without it the isolation suite would pass while proving
    # nothing. Here the reasoning inverts. This table is not tenant-scoped, and
    # the owner is precisely the role that must be able to write it — that is
    # what makes "the application cannot promote anyone" true. Under FORCE the
    # only policy below is `FOR SELECT`, so *no* role can insert, including the
    # migrator, and `scripts/grant_staff.py` fails with a policy violation. The
    # first version of this migration did exactly that; the isolation suite
    # caught it on the fixture that seeds a staff member.
    #
    # What still constrains `soyl_app` is unchanged and does not depend on
    # FORCE: the policy below for reads, and the absence of an INSERT grant for
    # writes. `test_staff_cannot_promote_anyone` and
    # `test_staff_cannot_enumerate_other_staff` are the checks.
    op.execute("ALTER TABLE core.staff_user ENABLE ROW LEVEL SECURITY")
    # Two ways in, both narrow to a single row:
    #
    #   app.user_id  — "am *I* staff?", asked during principal resolution on
    #                  the user-scoped session migration 003 introduced.
    #   app.staff_id — the lookup `core.is_staff()` performs. Circular-looking
    #                  and safe: it can only confirm a row the caller already
    #                  named, never enumerate the table.
    #
    # Nobody can list who is staff through `soyl_app`, which is the right
    # default for a table whose contents are an attacker's shortlist.
    op.execute(
        f"""
        CREATE POLICY staff_self_read ON core.staff_user
        FOR SELECT USING (
            user_id = NULLIF(current_setting('app.user_id', TRUE), '')::uuid
            OR user_id = NULLIF(current_setting('{STAFF_SETTING}', TRUE), '')::uuid
        )
        """
    )
    op.execute(f"GRANT SELECT ON core.staff_user TO {APP_ROLE}")

    # ── The predicate ───────────────────────────────────────────────────────
    # STABLE and argument-free, which matters for more than correctness: a qual
    # that references no column is evaluated once per query as a One-Time
    # Filter, not once per row. A VOLATILE version here would call this on
    # every row of every scan on every table.
    #
    # SECURITY INVOKER (the default), not DEFINER. The policy above already
    # makes the row visible to the caller, so the function needs no elevation —
    # and a SECURITY DEFINER function that reads a security table is a thing
    # worth not having.
    op.execute(
        f"""
        CREATE FUNCTION core.is_staff() RETURNS boolean
        LANGUAGE sql
        STABLE
        AS $$
            SELECT EXISTS (
                SELECT 1 FROM core.staff_user s
                WHERE s.user_id = NULLIF(current_setting('{STAFF_SETTING}', TRUE), '')::uuid
                  AND s.revoked_at IS NULL
            )
        $$
        """
    )
    op.execute(
        "COMMENT ON FUNCTION core.is_staff() IS "
        "'True when app.staff_id names a live row in core.staff_user. The "
        "predicate behind every staff_read policy.'"
    )
    op.execute("REVOKE EXECUTE ON FUNCTION core.is_staff() FROM PUBLIC")
    op.execute(f"GRANT EXECUTE ON FUNCTION core.is_staff() TO {APP_ROLE}")

    # ── The additive read policy, on every table that has tenant_isolation ──
    # Read from the catalogue rather than a list, so the set cannot drift from
    # what actually exists at this revision. At 007 that is fifteen tables:
    # core.tenant, property, membership, membership_property; audit.log;
    # rag.document, chunk, chunk_question, ingestion_job; billing.usage_ledger;
    # ai.conversation, turn, envelope, retrieval_log, feedback.
    op.execute(
        """
        DO $$
        DECLARE
            r record;
        BEGIN
            FOR r IN
                SELECT schemaname, tablename
                FROM pg_policies
                WHERE policyname = 'tenant_isolation'
            LOOP
                EXECUTE format(
                    'CREATE POLICY staff_read ON %I.%I FOR SELECT USING (core.is_staff())',
                    r.schemaname, r.tablename
                );
            END LOOP;
        END
        $$
        """
    )

    # ── What the inspector needs and M4 did not keep ────────────────────────
    # §11 wants the answer inspector to show "the raw model output, what
    # validation stripped". M4 logged both at WARNING and persisted neither, so
    # the evidence for the single question the inspector exists to answer —
    # *why did it say that* — expired with the log retention.
    #
    # On `ai.envelope` rather than `ai.turn` because they are read together and
    # exactly as often: never, until someone opens one turn. Putting kilobytes
    # of draft on the turn row would slow every conversation list to store
    # something no list displays.
    op.execute("ALTER TABLE ai.envelope ADD COLUMN draft jsonb NULL")
    op.execute("ALTER TABLE ai.envelope ADD COLUMN strips jsonb NOT NULL DEFAULT '[]'::jsonb")
    op.execute(
        "COMMENT ON COLUMN ai.envelope.draft IS "
        "'The model''s structured output before the provenance validator ran. "
        "Compared against body, this is what validation changed.'"
    )
    op.execute(
        "COMMENT ON COLUMN ai.envelope.strips IS "
        "'Blocks the validator removed, with the reason. Empty is the normal "
        "case and a long array is a retrieval or prompt problem.'"
    )

    # §11: the questions list is "full-text searchable". Stemmed rather than
    # substring — searching `cancel` finds "cancelled" and "cancellation",
    # which is what an operator means, and `websearch_to_tsquery` gives them
    # quoted phrases and `-exclusions` for free. The index has to spell out
    # 'english' as a constant: `to_tsvector(text)` reads
    # `default_text_search_config` and is therefore not immutable, so an index
    # on it is rejected.
    op.execute(
        "CREATE INDEX ix_turn_input_fts ON ai.turn "
        "USING GIN (to_tsvector('english', input))"
    )

    # ── Impersonation ───────────────────────────────────────────────────────
    # A column on the existing session table rather than a parallel table. An
    # impersonated session must expire, be revocable and resolve to a principal
    # exactly like any other, and `core.session` already does all three; a
    # second table would be a second thing to get right.
    #
    # Non-null means "this session was minted by staff on someone's behalf".
    # Everything that reads a session can therefore tell, which is what makes a
    # banner possible and what makes the audit trail honest.
    op.execute("ALTER TABLE core.session ADD COLUMN impersonated_by uuid NULL")
    op.execute(
        "ALTER TABLE core.session ADD CONSTRAINT fk_session_impersonated_by_user_account "
        "FOREIGN KEY (impersonated_by) REFERENCES core.user_account(id) ON DELETE CASCADE"
    )
    op.execute(
        "COMMENT ON COLUMN core.session.impersonated_by IS "
        "'Staff user who minted this session on the account owner''s behalf. "
        "Non-null sessions are read-only and short-lived.'"
    )
    # "What has staff been doing" — a small partial index because the answer is
    # a handful of rows against a table of every live session.
    op.execute(
        "CREATE INDEX ix_session_impersonated_by ON core.session (impersonated_by, created_at DESC) "
        "WHERE impersonated_by IS NOT NULL"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ai.ix_turn_input_fts")
    op.execute("ALTER TABLE ai.envelope DROP COLUMN IF EXISTS strips")
    op.execute("ALTER TABLE ai.envelope DROP COLUMN IF EXISTS draft")

    op.execute("DROP INDEX IF EXISTS core.ix_session_impersonated_by")
    op.execute(
        "ALTER TABLE core.session DROP CONSTRAINT IF EXISTS fk_session_impersonated_by_user_account"
    )
    op.execute("ALTER TABLE core.session DROP COLUMN IF EXISTS impersonated_by")

    op.execute(
        """
        DO $$
        DECLARE
            r record;
        BEGIN
            FOR r IN
                SELECT schemaname, tablename FROM pg_policies WHERE policyname = 'staff_read'
            LOOP
                EXECUTE format('DROP POLICY staff_read ON %I.%I', r.schemaname, r.tablename);
            END LOOP;
        END
        $$
        """
    )

    op.execute("DROP FUNCTION IF EXISTS core.is_staff()")
    op.execute(f"REVOKE ALL ON core.staff_user FROM {APP_ROLE}")
    op.execute("DROP TABLE IF EXISTS core.staff_user")
