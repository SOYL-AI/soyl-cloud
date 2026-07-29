"""Run the retrieval eval.

    uv run python -m evals.run              # fake providers — plumbing only
    uv run python -m evals.run --azure      # real embeddings, real reranker

**The default run does not measure quality.** `FakeEmbeddings` hashes text into
a vector, so its geometry is arbitrary; a recall number computed from it
describes the hash. The default exists so the harness itself stays under test
in CI — that labels resolve, that scoring arithmetic is right, that nothing
raises — and the number it prints is not evidence of anything.

`--azure` is the run that counts, and the only one whose output belongs in a
decision. It costs a few rupees and takes a couple of minutes.

Everything is created in a throwaway tenant and deleted afterwards, so this is
safe to run against a database that has real data in it — though it is written
to be pointed at the local compose stack.
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys
import uuid
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy.sql import text

from evals.answers import render_answers, run_answers
from evals.harness import (
    CORPUS,
    LabelError,
    load_questions,
    render,
    resolve_labels,
    run,
)
from soyl.application.rag.ingest_document import ingest_document
from soyl.domain.ai.ports import EmbeddingProvider, QuestionProvider, RerankProvider
from soyl.domain.storage import document_key
from soyl.infrastructure.db.repositories.document_repository import IngestionJobRepository
from soyl.infrastructure.db.session import create_engine, create_session_factory, tenant_session
from soyl.infrastructure.providers.factory import (
    build_answer_provider,
    build_embedding_provider,
    build_question_provider,
    build_rerank_provider,
)
from soyl.infrastructure.providers.fake import FakeEmbeddings
from soyl.infrastructure.providers.fake_answers import FakeAnswers
from soyl.infrastructure.providers.fake_questions import FakeQuestions
from soyl.infrastructure.providers.fake_rerank import FakeRerank
from soyl.infrastructure.storage.s3 import S3Storage
from soyl.settings import get_settings


async def ingest_corpus(
    factory: async_sessionmaker[AsyncSession],
    storage: S3Storage,
    *,
    tenant_id: uuid.UUID,
    embeddings: EmbeddingProvider,
    questions: QuestionProvider,
) -> int:
    """Put the corpus through the real pipeline, not a shortcut.

    Chunking, context headers, hypothetical questions and embeddings all run
    exactly as they do for a customer document. Loading chunks directly would
    be faster and would measure a pipeline we do not ship.
    """
    import httpx

    total = 0
    for path in sorted(CORPUS.glob("*.md")):
        data = path.read_bytes()
        document_id = uuid.uuid4()
        key = document_key(tenant_id=tenant_id, document_id=document_id, filename=path.name)

        ticket = await storage.upload_ticket(
            key=key, content_type="text/markdown", max_bytes=len(data) + 1
        )
        async with httpx.AsyncClient() as client:
            response = await client.put(
                ticket.url, content=data, headers=ticket.required_headers
            )
        response.raise_for_status()

        async with tenant_session(factory, tenant_id) as session:
            await session.execute(
                text(
                    "INSERT INTO rag.document "
                    "(id, tenant_id, title, doc_type, blob_uri, checksum) "
                    "VALUES (:id, :tenant_id, :title, 'sop', :uri, :checksum)"
                ),
                {
                    "id": document_id,
                    "tenant_id": tenant_id,
                    "title": path.name,
                    "uri": key,
                    "checksum": uuid.uuid4().hex,
                },
            )
            job = await IngestionJobRepository(session).create(
                document_id=document_id, tenant_id=tenant_id
            )
            job_id = job.id

        result = await ingest_document(
            factory=factory,
            storage=storage,
            embeddings=embeddings,
            questions=questions,
            tenant_id=tenant_id,
            document_id=document_id,
            job_id=job_id,
        )
        total += result.chunk_count
        print(f"  {path.name:32} {result.chunk_count:3} chunks", flush=True)

    return total


async def load_corpus_chunks(
    factory: async_sessionmaker[AsyncSession], tenant_id: uuid.UUID
) -> list[tuple[uuid.UUID, str, list[str], str]]:
    async with tenant_session(factory, tenant_id) as session:
        rows = (
            await session.execute(
                text(
                    "SELECT c.id, d.title, c.heading_path, c.content "
                    "FROM rag.chunk c JOIN rag.document d ON d.id = c.document_id"
                )
            )
        ).all()
    return [(row.id, row.title, list(row.heading_path or []), row.content) for row in rows]


async def main(*, azure: bool, keep: bool, pace: float, with_answers: bool) -> int:
    settings = get_settings()

    embeddings: EmbeddingProvider
    questions_provider: QuestionProvider
    reranker: RerankProvider

    if azure:
        if not (settings.azure_openai_endpoint and settings.azure_openai_api_key):
            print("--azure needs SOYL_AZURE_OPENAI_ENDPOINT and SOYL_AZURE_OPENAI_API_KEY")
            return 2
        embeddings = build_embedding_provider(settings)
        questions_provider = build_question_provider(settings)
        reranker = build_rerank_provider(settings)
    else:
        embeddings = FakeEmbeddings(dimensions=settings.embedding_dimensions)
        questions_provider = FakeQuestions()
        reranker = FakeRerank()
        print("!! fake providers: the numbers below measure plumbing, not quality\n")

    answer_provider = build_answer_provider(settings) if azure else FakeAnswers()

    labelled, probes = load_questions()

    engine = create_engine(str(settings.database_url))
    factory = create_session_factory(engine)
    storage = S3Storage(
        endpoint_url=str(settings.storage_endpoint_url) if settings.storage_endpoint_url else None,
        region=settings.storage_region,
        bucket=settings.storage_bucket,
        access_key=settings.storage_access_key,
        secret_key=settings.storage_secret_key,
    )
    await storage.ensure_bucket()

    tenant_id = uuid.uuid4()
    async with tenant_session(factory, tenant_id) as session:
        await session.execute(
            text(
                "INSERT INTO core.tenant (id, name, slug, country) "
                "VALUES (:id, 'Retrieval Eval', :slug, 'IN')"
            ),
            {"id": tenant_id, "slug": f"eval-{uuid.uuid4().hex[:10]}"},
        )

    try:
        print(f"ingesting into tenant {tenant_id}")
        chunk_count = await ingest_corpus(
            factory,
            storage,
            tenant_id=tenant_id,
            embeddings=embeddings,
            questions=questions_provider,
        )
        print()

        chunks = await load_corpus_chunks(factory, tenant_id)
        try:
            labels = resolve_labels(chunks, labelled)
        except LabelError as error:
            print(f"label error: {error}")
            return 1

        report = await run(
            factory,
            tenant_id=tenant_id,
            embeddings=embeddings,
            reranker=reranker,
            questions=labelled,
            probes=probes,
            labels=labels,
            corpus_chunks=chunk_count,
            pace=pace if azure else 0.0,
        )
        print(render(report))

        if with_answers:
            # A user row is needed because a turn belongs to somebody. Created
            # here rather than in the fixture so a retrieval-only run does not
            # pay for it.
            # Through the *migrator*, not the app role. `core.user_account` is
            # untenanted and the app role has no DELETE on it by design — a
            # running application must not be able to remove a user account.
            # The eval creating one is a fixture concern, so it uses the
            # credential fixtures use.
            migration_url = os.environ.get("SOYL_MIGRATION_DATABASE_URL")
            if not migration_url:
                print("SOYL_MIGRATION_DATABASE_URL is not set; skipping the answer run")
                return 0

            migrator = create_engine(migration_url)
            user_id = uuid.uuid4()
            async with migrator.begin() as connection:
                await connection.execute(
                    text(
                        "INSERT INTO core.user_account (id, email, display_name) "
                        "VALUES (:id, :email, 'Eval')"
                    ),
                    {"id": user_id, "email": f"eval-{uuid.uuid4().hex[:10]}@example.test"},
                )

            answers_report = await run_answers(
                factory,
                tenant_id=tenant_id,
                user_id=user_id,
                embeddings=embeddings,
                answers=answer_provider,
                reranker=reranker,
                questions=labelled,
                probes=probes,
                pace=pace if azure else 0.0,
            )
            print(render_answers(answers_report))

            Path(__file__).parent.joinpath("last-answers.txt").write_text(
                render_answers(answers_report), encoding="utf-8"
            )

            async with migrator.begin() as connection:
                await connection.execute(
                    text("DELETE FROM core.user_account WHERE id = :id"), {"id": user_id}
                )
            await migrator.dispose()

        Path(__file__).parent.joinpath("last-run.txt").write_text(
            render(report), encoding="utf-8"
        )

        if not azure:
            return 0
        return 0 if report.passed else 1
    finally:
        if keep:
            print(f"\nkeeping tenant {tenant_id}")
        else:
            async with factory() as session, session.begin():
                await session.execute(
                    text("DELETE FROM core.tenant WHERE id = :id"), {"id": tenant_id}
                )
        await engine.dispose()


if __name__ == "__main__":
    # The report contains rupee signs, em dashes and box-drawing characters, and
    # a Windows console defaults to cp1252 — which raises UnicodeEncodeError
    # partway through printing and loses the run. `errors="replace"` rather than
    # a strict reconfigure because a mangled character is a better outcome than
    # a lost measurement.
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--azure", action="store_true", help="use the real providers; the only run that counts"
    )
    parser.add_argument("--keep", action="store_true", help="leave the tenant behind to inspect")
    parser.add_argument(
        "--answers",
        action="store_true",
        help="also run the full answer pipeline: citation integrity and, more "
        "importantly, whether it refuses questions the corpus does not cover.",
    )
    parser.add_argument(
        "--pace",
        type=float,
        default=6.0,
        help="seconds between questions. The deployment's tokens-per-minute quota is "
        "the binding constraint; too low and reranking is rate limited into a "
        "fusion-order fallback, which quietly measures a different pipeline.",
    )
    args = parser.parse_args()

    sys.exit(
        asyncio.run(
            main(
                azure=args.azure,
                keep=args.keep,
                pace=args.pace,
                with_answers=args.answers,
            )
        )
    )
