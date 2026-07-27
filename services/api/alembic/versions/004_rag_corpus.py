"""The document corpus: documents, chunks, hypothetical questions, ingestion jobs.

Revision ID: 004
Revises: 003
Create Date: 2026-07-28

Schema from `UPDATE.md` §7, indexes from handbook §48.8, chunk shape from §43.

Every table here is tenant-scoped and carries the same ENABLE + FORCE + policy
treatment as `core`. That is not boilerplate on this one: these tables hold the
customer's actual documents, which is the material the whole product exists to
protect. The schema-wide assertion in the isolation suite covers them
automatically the moment they appear.

Three decisions worth reading before changing anything here:

**`ON DELETE CASCADE` from document to chunk to question.** Erasure has to be
real — a DPDP processor obligation is to destroy personal data on request and
certify it — and a soft-deleted document whose chunks still sit in a vector
index is not destroyed. Deleting the document row removes everything derived
from it in one statement.

**`content_tsv` is a generated column, not a trigger.** Postgres keeps it in
step with `content` by construction, so a chunk cannot be written with a stale
or missing lexical index. Hybrid retrieval (§45.1) depends on it existing for
every row.

**HNSW, not IVFFlat** (§48.8). HNSW needs no training step and handles
incremental inserts gracefully, which matters when documents arrive
continuously rather than in one load.
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "004"
down_revision: str | None = "003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

APP_ROLE = "soyl_app"

TENANT_PREDICATE = "(tenant_id = NULLIF(current_setting('app.tenant_id', TRUE), '')::uuid)"

# text-embedding-3-small and most peers. Changing this is a migration and a
# reindex, which is why `embedding_model` is stored per row: a model change can
# be rolled forward document by document rather than in one outage.
EMBEDDING_DIMENSIONS = 1536

TENANT_SCOPED = ("document", "chunk", "chunk_question", "ingestion_job")


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS rag")

    # ── Documents ───────────────────────────────────────────────────────────
    op.create_table(
        "document",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        # Which properties this document applies to. Empty means tenant-wide —
        # a group-level policy that has not been narrowed to any one hotel.
        sa.Column(
            "property_ids",
            postgresql.ARRAY(postgresql.UUID(as_uuid=True)),
            server_default="{}",
            nullable=False,
        ),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("doc_type", sa.Text(), nullable=False, server_default="other"),
        sa.Column("language", sa.Text(), nullable=False, server_default="en"),
        # Where the bytes live, as a storage-port URI. Never a public URL.
        sa.Column("blob_uri", sa.Text(), nullable=False),
        # SHA-256 of the uploaded file. Re-uploading the same document is a
        # no-op rather than a duplicate corpus entry.
        sa.Column("checksum", sa.Text(), nullable=False),
        sa.Column("page_count", sa.Integer(), nullable=True),
        # Validity window. §8: expired documents are excluded from retrieval by
        # default, because a superseded 2023 policy is worse than no policy.
        sa.Column("effective_from", sa.Date(), nullable=True),
        sa.Column("expires_on", sa.Date(), nullable=True),
        sa.Column("supersedes", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("sensitivity", sa.Text(), nullable=False, server_default="internal"),
        sa.Column("status", sa.Text(), nullable=False, server_default="uploaded"),
        sa.Column("metadata", postgresql.JSONB(), server_default="{}", nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "status IN ('uploaded', 'processing', 'ready', 'failed', 'superseded')",
            name="ck_document_status_is_known",
        ),
        sa.CheckConstraint(
            "sensitivity IN ('public', 'internal', 'confidential', 'restricted')",
            name="ck_document_sensitivity_is_known",
        ),
        sa.CheckConstraint(
            "expires_on IS NULL OR effective_from IS NULL OR expires_on >= effective_from",
            name="ck_document_validity_window_is_ordered",
        ),
        sa.ForeignKeyConstraint(
            ["tenant_id"], ["core.tenant.id"], name="fk_document_tenant_id_tenant",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["supersedes"], ["rag.document.id"], name="fk_document_supersedes_document",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_document"),
        # Same file, same tenant, twice is the same document.
        sa.UniqueConstraint("tenant_id", "checksum", name="uq_document_tenant_id_checksum"),
        schema="rag",
    )
    op.create_index(
        "ix_document_tenant_id_status", "document", ["tenant_id", "status"], schema="rag"
    )
    op.execute(
        "CREATE INDEX ix_document_property_ids ON rag.document USING GIN (property_ids)"
    )

    # ── Chunks ──────────────────────────────────────────────────────────────
    op.create_table(
        "chunk",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("document_id", postgresql.UUID(as_uuid=True), nullable=False),
        # Denormalised from the document so the policy and the pre-filter can
        # both work without a join. §8: filters are applied *before* the vector
        # search, never after.
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "property_ids",
            postgresql.ARRAY(postgresql.UUID(as_uuid=True)),
            server_default="{}",
            nullable=False,
        ),
        sa.Column("ordinal", sa.Integer(), nullable=False),
        # e.g. {'3. Escalation', '3.2 Noise complaints after 22:00'} — what
        # gives a chunk its meaning, and what goes into the context header.
        sa.Column("heading_path", postgresql.ARRAY(sa.Text()), server_default="{}", nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        # The §43.2 header, stored rather than rebuilt: it is what was actually
        # embedded, and regenerating it later would silently diverge from the
        # vector it produced.
        sa.Column("context_header", sa.Text(), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("keywords", postgresql.ARRAY(sa.Text()), server_default="{}", nullable=False),
        sa.Column("doc_type", sa.Text(), nullable=True),
        sa.Column("effective_from", sa.Date(), nullable=True),
        sa.Column("expires_on", sa.Date(), nullable=True),
        sa.Column("token_count", sa.Integer(), nullable=True),
        sa.Column("embedding", postgresql.ARRAY(sa.Float()), nullable=True),
        sa.Column("embedding_model", sa.Text(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.ForeignKeyConstraint(
            ["document_id"], ["rag.document.id"], name="fk_chunk_document_id_document",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["tenant_id"], ["core.tenant.id"], name="fk_chunk_tenant_id_tenant",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_chunk"),
        sa.UniqueConstraint("document_id", "ordinal", name="uq_chunk_document_id_ordinal"),
        schema="rag",
    )

    # vector(1536) proper, not the float[] the table was created with —
    # SQLAlchemy has no native pgvector type without the extra package, and the
    # column type is what the HNSW index needs.
    op.execute(
        f"ALTER TABLE rag.chunk ALTER COLUMN embedding TYPE vector({EMBEDDING_DIMENSIONS}) "
        f"USING embedding::vector({EMBEDDING_DIMENSIONS})"
    )

    # Generated, so it cannot drift from content. 'english' is a starting
    # point; a Hindi or multilingual configuration is a later migration.
    op.execute(
        "ALTER TABLE rag.chunk ADD COLUMN content_tsv tsvector "
        "GENERATED ALWAYS AS (to_tsvector('english', coalesce(content, ''))) STORED"
    )

    op.execute("CREATE INDEX ix_chunk_content_tsv ON rag.chunk USING GIN (content_tsv)")
    op.execute("CREATE INDEX ix_chunk_property_ids ON rag.chunk USING GIN (property_ids)")
    op.create_index("ix_chunk_tenant_id", "chunk", ["tenant_id"], schema="rag")
    op.create_index("ix_chunk_document_id", "chunk", ["document_id"], schema="rag")

    # m=16, ef_construction=64 per §48.8. Built now while the table is empty,
    # which is far cheaper than adding it to a populated corpus.
    op.execute(
        "CREATE INDEX ix_chunk_embedding_hnsw ON rag.chunk "
        "USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64)"
    )

    # ── Hypothetical questions (§43.2) ──────────────────────────────────────
    op.create_table(
        "chunk_question",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("chunk_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("embedding", postgresql.ARRAY(sa.Float()), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.ForeignKeyConstraint(
            ["chunk_id"], ["rag.chunk.id"], name="fk_chunk_question_chunk_id_chunk",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["tenant_id"], ["core.tenant.id"], name="fk_chunk_question_tenant_id_tenant",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_chunk_question"),
        schema="rag",
    )
    op.execute(
        f"ALTER TABLE rag.chunk_question ALTER COLUMN embedding TYPE vector({EMBEDDING_DIMENSIONS}) "
        f"USING embedding::vector({EMBEDDING_DIMENSIONS})"
    )
    op.execute(
        "CREATE INDEX ix_chunk_question_embedding_hnsw ON rag.chunk_question "
        "USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64)"
    )
    op.create_index("ix_chunk_question_chunk_id", "chunk_question", ["chunk_id"], schema="rag")

    # ── Ingestion jobs ──────────────────────────────────────────────────────
    op.create_table(
        "ingestion_job",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("document_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", sa.Text(), nullable=False, server_default="queued"),
        # Which step it reached. The difference between "extraction failed" and
        # "embedding failed" is the difference between a scanned PDF and a
        # provider outage, and the UI has to be able to say which.
        sa.Column("stage", sa.Text(), nullable=True),
        # Readable. M3's acceptance is that a corrupt file fails with something
        # a person can act on rather than a stack trace.
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.CheckConstraint(
            "status IN ('queued', 'running', 'succeeded', 'failed')",
            name="ck_ingestion_job_status_is_known",
        ),
        sa.ForeignKeyConstraint(
            ["document_id"], ["rag.document.id"], name="fk_ingestion_job_document_id_document",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["tenant_id"], ["core.tenant.id"], name="fk_ingestion_job_tenant_id_tenant",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_ingestion_job"),
        schema="rag",
    )
    op.create_index(
        "ix_ingestion_job_tenant_id_status", "ingestion_job", ["tenant_id", "status"], schema="rag"
    )
    op.create_index(
        "ix_ingestion_job_document_id", "ingestion_job", ["document_id"], schema="rag"
    )

    # ── Row-level security ──────────────────────────────────────────────────
    for table in TENANT_SCOPED:
        op.execute(f"ALTER TABLE rag.{table} ENABLE ROW LEVEL SECURITY")
        op.execute(f"ALTER TABLE rag.{table} FORCE ROW LEVEL SECURITY")
        op.execute(
            f"CREATE POLICY tenant_isolation ON rag.{table} "
            f"FOR ALL USING {TENANT_PREDICATE} WITH CHECK {TENANT_PREDICATE}"
        )

    # ── Grants ──────────────────────────────────────────────────────────────
    op.execute(f"GRANT USAGE ON SCHEMA rag TO {APP_ROLE}")
    for table in TENANT_SCOPED:
        op.execute(f"GRANT SELECT, INSERT, UPDATE, DELETE ON rag.{table} TO {APP_ROLE}")


def downgrade() -> None:
    for table in reversed(TENANT_SCOPED):
        op.execute(f"REVOKE ALL ON rag.{table} FROM {APP_ROLE}")

    op.drop_table("ingestion_job", schema="rag")
    op.drop_table("chunk_question", schema="rag")
    op.drop_table("chunk", schema="rag")
    op.drop_table("document", schema="rag")
    op.execute("DROP SCHEMA IF EXISTS rag CASCADE")
