"""Ingesting one document.

    download → extract → chunk → enrich → embed → persist → ready

Runs in the worker, never in a request. `UPDATE.md` §5 is explicit that
ingestion must not run in the request path, and the reason is visible in the
acceptance criterion: a 40-page PDF has two minutes to become queryable, which
is fine for a background job and catastrophic for an HTTP handler.

Three properties this file exists to hold:

**Every failure names its stage.** "Extraction failed" and "embedding failed"
are a scanned PDF and a provider outage respectively, and the person looking at
the ingestion list needs to know which.

**Retryable and permanent are distinguished.** A provider timeout is worth
another attempt; a corrupt PDF will fail identically forever, and retrying it
spends money to learn nothing.

**Reprocessing is idempotent.** Chunks are replaced rather than appended, so a
retry after a partial failure produces one clean set rather than a corpus with
the first half of a document in it twice.
"""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy.sql import text

from soyl.domain.ai.ports import EmbeddingProvider, ProviderError, QuestionProvider
from soyl.domain.rag.chunking import chunk_document, context_header
from soyl.domain.storage import ObjectNotFound, StoragePort
from soyl.infrastructure.db.repositories.document_repository import (
    ChunkRepository,
    DocumentRepository,
    IngestionJobRepository,
    vector_literal,
)
from soyl.infrastructure.db.repositories.usage_repository import UsageRepository
from soyl.infrastructure.db.session import tenant_session
from soyl.infrastructure.rag.extraction import ExtractionError, extract
from soyl.infrastructure.rag.tokens import count_tokens

logger = logging.getLogger("soyl.rag.ingest")

# How many chunks to embed per provider call. Large enough that a 40-page SOP
# is a handful of round trips, small enough to stay clear of request size
# limits and to lose little work when one call fails.
EMBED_BATCH = 64

STAGES = ("download", "extract", "chunk", "embed", "persist")


class IngestionFailed(Exception):
    def __init__(self, message: str, *, stage: str, retryable: bool) -> None:
        self.stage = stage
        self.retryable = retryable
        super().__init__(message)


@dataclass(frozen=True, slots=True)
class IngestionResult:
    document_id: uuid.UUID
    chunk_count: int
    page_count: int


async def ingest_document(
    *,
    factory: async_sessionmaker[AsyncSession],
    storage: StoragePort,
    embeddings: EmbeddingProvider,
    tenant_id: uuid.UUID,
    document_id: uuid.UUID,
    job_id: uuid.UUID,
    questions: QuestionProvider | None = None,
    questions_per_chunk: int = 3,
) -> IngestionResult:
    """Run the pipeline for one document. Raises `IngestionFailed` on any stage.

    Each stage opens its own tenant-scoped session rather than holding one
    across the whole run: embedding a large document can take a minute, and a
    transaction held open across a network call to a third party is a
    connection nobody else can use and a lock nobody expected.
    """
    stage = "download"

    try:
        async with tenant_session(factory, tenant_id) as session:
            await IngestionJobRepository(session).mark_running(job_id, stage)
            document = await DocumentRepository(session).get(document_id)
            if document is None:
                raise IngestionFailed(
                    "The document no longer exists.", stage=stage, retryable=False
                )
            await DocumentRepository(session).set_status(document_id, "processing")

            blob_uri = document.blob_uri
            title = document.title
            doc_type = document.doc_type
            property_ids = list(document.property_ids)

        # ── download ────────────────────────────────────────────────────────
        try:
            data = await storage.download(key=blob_uri)
        except ObjectNotFound as exc:
            raise IngestionFailed(
                "The uploaded file could not be found in storage. Please upload it again.",
                stage=stage,
                retryable=False,
            ) from exc
        except Exception as exc:
            raise IngestionFailed(
                f"Storage was unreachable: {type(exc).__name__}", stage=stage, retryable=True
            ) from exc

        # ── extract ─────────────────────────────────────────────────────────
        stage = "extract"
        await _set_stage(factory, tenant_id, job_id, stage)
        try:
            extracted = extract(data, content_type="", filename=title)
        except ExtractionError as exc:
            # Already written for a person; pass it through unchanged.
            raise IngestionFailed(str(exc), stage=stage, retryable=exc.retryable) from exc

        # ── chunk ───────────────────────────────────────────────────────────
        stage = "chunk"
        await _set_stage(factory, tenant_id, job_id, stage)
        chunks = chunk_document(extracted.text, doc_type=doc_type, count_tokens=count_tokens)

        if not chunks:
            raise IngestionFailed(
                "We could not find any text to index in this document.",
                stage=stage,
                retryable=False,
            )

        # ── embed ───────────────────────────────────────────────────────────
        stage = "embed"
        await _set_stage(factory, tenant_id, job_id, stage)

        if not property_ids:
            scope = "All properties"
        elif len(property_ids) == 1:
            scope = "1 property"
        else:
            scope = f"{len(property_ids)} properties"

        # §43.2: the header is what gets embedded, and it is stored alongside
        # the chunk because regenerating it later would diverge from the vector
        # it actually produced.
        headers = [
            context_header(title=title, heading_path=chunk.heading_path, property_scope=scope)
            for chunk in chunks
        ]
        payloads = [
            f"{header}\n{chunk.content}"
            for header, chunk in zip(headers, chunks, strict=True)
        ]

        vectors: list[list[float]] = []
        for start in range(0, len(payloads), EMBED_BATCH):
            batch = payloads[start : start + EMBED_BATCH]
            try:
                result = await embeddings.embed(batch)
            except ProviderError as exc:
                raise IngestionFailed(
                    "The embedding service could not be reached. This will be retried."
                    if exc.retryable
                    else "The embedding service rejected this document.",
                    stage=stage,
                    retryable=exc.retryable,
                ) from exc

            vectors.extend(result.vectors)

            # §6.6: one ledger row per model call, written as the call
            # completes rather than at the end — a job that dies halfway has
            # still spent the money and must still be attributable.
            async with tenant_session(factory, tenant_id) as session:
                await UsageRepository(session).record(
                    tenant_id=tenant_id,
                    kind="embed",
                    provider=result.usage.provider,
                    model=result.usage.model,
                    input_tokens=result.usage.input_tokens,
                    units=result.usage.units,
                    cost_inr=_cost(embeddings, result.usage.input_tokens),
                )

        # ── persist ─────────────────────────────────────────────────────────
        stage = "persist"
        await _set_stage(factory, tenant_id, job_id, stage)

        rows = [
            {
                "ordinal": chunk.ordinal,
                "heading_path": chunk.heading_path,
                "content": chunk.content,
                "context_header": header,
                "token_count": chunk.token_count,
                "embedding": vector_literal(vector),
                "keywords": [],
            }
            for chunk, header, vector in zip(chunks, headers, vectors, strict=True)
        ]

        async with tenant_session(factory, tenant_id) as session:
            written = await ChunkRepository(session).replace_all(
                document_id=document_id,
                tenant_id=tenant_id,
                property_ids=property_ids,
                doc_type=doc_type,
                chunks=rows,
                embedding_model=embeddings.model,
            )
            await DocumentRepository(session).set_status(
                document_id, "ready", page_count=extracted.page_count
            )
            await IngestionJobRepository(session).mark_succeeded(job_id)

        # ── hypothetical questions (§43.2) ──────────────────────────────────
        # Deliberately *after* the document is marked ready, and deliberately
        # unable to fail the ingestion. A document without hypothetical
        # questions is a slightly worse retrieval target; a document stuck in
        # 'processing' because a cheap model had a bad minute is a broken one.
        if questions is not None:
            await _generate_questions(
                factory=factory,
                questions=questions,
                embeddings=embeddings,
                tenant_id=tenant_id,
                document_id=document_id,
                per_chunk=questions_per_chunk,
            )

    except IngestionFailed as known:
        logger.warning(
            "ingestion failed document=%s stage=%s retryable=%s",
            document_id,
            known.stage,
            known.retryable,
        )
        await _record_failure(factory, tenant_id, document_id, job_id, known)
        raise
    except Exception as exc:
        # Anything unanticipated is still recorded against a stage, so the UI
        # never shows a document stuck in 'processing' with no explanation.
        unexpected = IngestionFailed(
            "Something went wrong while processing this document.", stage=stage, retryable=True
        )
        logger.exception("unexpected ingestion error document=%s stage=%s", document_id, stage)
        await _record_failure(factory, tenant_id, document_id, job_id, unexpected)
        raise unexpected from exc

    return IngestionResult(
        document_id=document_id, chunk_count=written, page_count=extracted.page_count
    )


def _cost(embeddings: EmbeddingProvider, tokens: int):  # type: ignore[no-untyped-def]
    """Ask the provider what it charged, if it knows.

    The port does not require a price — a future provider may bill per call —
    so this is a capability check rather than part of the protocol.
    """
    cost = getattr(embeddings, "cost_inr", None)
    return cost(tokens) if callable(cost) else 0


async def _set_stage(
    factory: async_sessionmaker[AsyncSession], tenant_id: uuid.UUID, job_id: uuid.UUID, stage: str
) -> None:
    async with tenant_session(factory, tenant_id) as session:
        await IngestionJobRepository(session).set_stage(job_id, stage)


async def _record_failure(
    factory: async_sessionmaker[AsyncSession],
    tenant_id: uuid.UUID,
    document_id: uuid.UUID,
    job_id: uuid.UUID,
    failure: IngestionFailed,
) -> None:
    """Write the failure where a person will see it.

    Its own session, because the failure may well have come from a transaction
    that is no longer usable.
    """
    try:
        async with tenant_session(factory, tenant_id) as session:
            await IngestionJobRepository(session).mark_failed(
                job_id, stage=failure.stage, error=str(failure)
            )
            await DocumentRepository(session).set_status(document_id, "failed")
    except Exception:
        logger.exception("could not record ingestion failure for document=%s", document_id)


async def _generate_questions(
    *,
    factory: async_sessionmaker[AsyncSession],
    questions: QuestionProvider,
    embeddings: EmbeddingProvider,
    tenant_id: uuid.UUID,
    document_id: uuid.UUID,
    per_chunk: int,
) -> int:
    """Write hypothetical questions for a document's chunks.

    Never raises. Every failure path here leaves a document that is already
    `ready` and searchable — the questions are an improvement to retrieval, not
    a precondition for it, and §43.2 describes them as closing a vocabulary gap
    rather than as the index itself.
    """
    written = 0

    try:
        async with tenant_session(factory, tenant_id) as session:
            rows = (
                await session.execute(
                    text(
                        "SELECT id, context_header, content FROM rag.chunk "
                        "WHERE document_id = :id ORDER BY ordinal"
                    ),
                    {"id": document_id},
                )
            ).all()

        for row in rows:
            try:
                generated = await questions.generate(
                    context_header=row.context_header or "",
                    content=row.content,
                    count=per_chunk,
                )
            except ProviderError:
                # One chunk failing does not justify abandoning the rest.
                logger.warning("question generation failed for chunk=%s", row.id)
                continue

            if not generated.questions:
                continue

            vectors = await embeddings.embed(generated.questions)

            async with tenant_session(factory, tenant_id) as session:
                for question, vector in zip(
                    generated.questions, vectors.vectors, strict=True
                ):
                    await session.execute(
                        text(
                            "INSERT INTO rag.chunk_question "
                            "(chunk_id, tenant_id, question, embedding) "
                            "VALUES (:chunk_id, :tenant_id, :question, CAST(:embedding AS vector))"
                        ),
                        {
                            "chunk_id": row.id,
                            "tenant_id": tenant_id,
                            "question": question,
                            "embedding": vector_literal(vector),
                        },
                    )
                    written += 1

                await UsageRepository(session).record(
                    tenant_id=tenant_id,
                    kind="llm",
                    provider=generated.usage.provider,
                    model=generated.usage.model,
                    route="hypothetical_questions",
                    input_tokens=generated.usage.input_tokens,
                    output_tokens=generated.usage.output_tokens,
                    cost_inr=_question_cost(questions, generated.usage),
                )
    except Exception:
        logger.exception("question generation failed for document=%s", document_id)

    return written


def _question_cost(provider: QuestionProvider, usage: object):  # type: ignore[no-untyped-def]
    cost = getattr(provider, "cost_inr", None)
    if not callable(cost):
        return 0
    return cost(
        getattr(usage, "input_tokens", 0), getattr(usage, "output_tokens", 0)
    )
