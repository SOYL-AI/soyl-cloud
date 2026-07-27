"""Let a user see their own memberships.

Revision ID: 003
Revises: 002
Create Date: 2026-07-28

**The bug this fixes.** `core.membership` is tenant-scoped, so its policy needs
``app.tenant_id``. But the query that *discovers which tenants a user belongs
to* cannot supply one — the tenant is the answer, not the question. So the
lookup ran with no tenant set, RLS correctly returned zero rows, and every
login concluded the user had no memberships. Silently. Every user would have
been permanently stranded at "no tenant selected" the moment they signed in
again, and no repository-level test could see it, because a repository test
sets a tenant before it asks anything.

Found by the API-level isolation suite in M2, which is precisely what it is for.

**The fix.** A second, narrower session variable — ``app.user_id`` — and one
additional permissive policy per table. Postgres ORs permissive policies, so
this *widens* access by exactly one case: a user may always see the rows that
describe their own membership.

That is not a cross-tenant leak. It is their own data, it is what the tenant
picker in the UI renders, and it exposes no tenant *content* — a membership row
names a tenant id and a role, and reading any of that tenant's actual data
still requires ``app.tenant_id`` to be set to it.

Both policies are SELECT-only. Nothing here lets anyone grant themselves a
membership.
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op

revision: str = "003"
down_revision: str | None = "002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

USER_PREDICATE = "(user_id = NULLIF(current_setting('app.user_id', TRUE), '')::uuid)"


def upgrade() -> None:
    # A user may read their own membership rows, whatever tenant they name.
    op.execute(
        f"CREATE POLICY membership_self_read ON core.membership "
        f"FOR SELECT USING {USER_PREDICATE}"
    )

    # And the property grants attached to those memberships, so an effective
    # property set can be resolved before a tenant session is opened.
    #
    # The subquery is safe from recursion: core.membership's policies do not
    # reference core.membership_property, so this cannot loop. It relies on the
    # policy created immediately above to see the parent row.
    op.execute(
        """
        CREATE POLICY membership_property_self_read ON core.membership_property
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM core.membership m
                WHERE m.id = membership_id
                  AND m.user_id = NULLIF(current_setting('app.user_id', TRUE), '')::uuid
            )
        )
        """
    )


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS membership_property_self_read ON core.membership_property")
    op.execute("DROP POLICY IF EXISTS membership_self_read ON core.membership")
