"""The usage ledger.

Revision ID: 005
Revises: 004
Create Date: 2026-07-28

`UPDATE.md` §6.6 is unusually precise about the timing: *"the usage ledger from
the first model call."* Embedding a chunk is a model call, so the ledger has to
exist before the ingestion pipeline can run — not after, when the interesting
question has already become unanswerable for every document ingested so far.

The reason it is a non-negotiable rather than a nice-to-have: **we need to know
what a customer costs before we price them.** A ledger added in month three
answers that question starting in month three.

Schema from handbook §34.3, partitioned monthly on `occurred_at` like
`audit.log`, with the same DEFAULT-partition safety net for the same reason —
a model call that cannot be recorded must not be able to fail the answer it
was producing.
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op

revision: str = "005"
down_revision: str | None = "004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

APP_ROLE = "soyl_app"

PREDICATE = "(tenant_id = NULLIF(current_setting('app.tenant_id', TRUE), '')::uuid)"


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS billing")

    op.execute(
        """
        CREATE TABLE billing.usage_ledger (
            id             bigserial   NOT NULL,
            occurred_at    timestamptz NOT NULL DEFAULT now(),
            tenant_id      uuid        NOT NULL,
            user_id        uuid        NULL,
            -- Null for ingestion: embedding a document belongs to no
            -- conversational turn. Set once M4 has turns to attribute to.
            turn_id        uuid        NULL,
            kind           text        NOT NULL,
            provider       text        NULL,
            model          text        NULL,
            route          text        NULL,
            input_tokens   integer     NOT NULL DEFAULT 0,
            output_tokens  integer     NOT NULL DEFAULT 0,
            cached_tokens  integer     NOT NULL DEFAULT 0,
            -- For things billed per unit rather than per token: pages of OCR,
            -- reranked candidates.
            units          numeric(14, 4) NOT NULL DEFAULT 0,
            -- INR because that is the currency we price in. Provider prices
            -- are USD, so the conversion happens at write time and the rate
            -- used is recorded in `route` context rather than reconstructed
            -- later from a rate nobody wrote down.
            cost_inr       numeric(12, 4) NOT NULL DEFAULT 0,
            CONSTRAINT pk_usage_ledger PRIMARY KEY (id, occurred_at),
            CONSTRAINT ck_usage_ledger_kind_is_known
                CHECK (kind IN ('llm', 'tool', 'embed', 'rerank', 'external')),
            CONSTRAINT ck_usage_ledger_tokens_are_not_negative
                CHECK (input_tokens >= 0 AND output_tokens >= 0 AND cached_tokens >= 0),
            CONSTRAINT ck_usage_ledger_cost_is_not_negative CHECK (cost_inr >= 0)
        ) PARTITION BY RANGE (occurred_at)
        """
    )
    op.execute(
        "COMMENT ON TABLE billing.usage_ledger IS "
        "'Append-only. Every model call writes one row. soyl_app holds INSERT "
        "and SELECT only: a cost ledger the application can rewrite is not a "
        "ledger.'"
    )

    op.execute("CREATE TABLE billing.usage_ledger_default PARTITION OF billing.usage_ledger DEFAULT")
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
                    'CREATE TABLE billing.usage_ledger_%s PARTITION OF billing.usage_ledger '
                    'FOR VALUES FROM (%L) TO (%L)',
                    to_char(from_date, 'YYYY_MM'), from_date, to_date
                );
            END LOOP;
        END
        $$
        """
    )

    # "What does this customer cost per day" is the query this exists to
    # answer, so it is the one that gets an index.
    op.execute(
        "CREATE INDEX ix_usage_ledger_tenant_id_occurred_at "
        "ON billing.usage_ledger (tenant_id, occurred_at DESC)"
    )
    op.execute(
        "CREATE INDEX ix_usage_ledger_kind_occurred_at "
        "ON billing.usage_ledger (kind, occurred_at DESC)"
    )

    op.execute("ALTER TABLE billing.usage_ledger ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE billing.usage_ledger FORCE ROW LEVEL SECURITY")
    op.execute(
        f"CREATE POLICY tenant_isolation ON billing.usage_ledger "
        f"FOR ALL USING {PREDICATE} WITH CHECK {PREDICATE}"
    )

    op.execute(f"GRANT USAGE ON SCHEMA billing TO {APP_ROLE}")
    # No UPDATE, no DELETE. Same reasoning as audit.log.
    op.execute(f"GRANT SELECT, INSERT ON billing.usage_ledger TO {APP_ROLE}")
    op.execute(
        f"GRANT USAGE, SELECT ON SEQUENCE billing.usage_ledger_id_seq TO {APP_ROLE}"
    )


def downgrade() -> None:
    op.execute(f"REVOKE ALL ON billing.usage_ledger FROM {APP_ROLE}")
    op.execute("DROP TABLE billing.usage_ledger CASCADE")
    op.execute("DROP SCHEMA IF EXISTS billing CASCADE")
