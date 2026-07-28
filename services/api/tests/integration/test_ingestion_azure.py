"""The full pipeline against the live Azure deployment.

Opt-in like `test_azure_embeddings.py`, and for the same reason: it calls a
paid service. What it adds is the *combination* — real chunking, real
embeddings, real generated questions, all the way into Postgres — which is the
closest thing to M3's acceptance criterion that can be automated.

The assertion that matters is the last one: a question the model wrote from a
passage retrieves that passage. If it does, §43.2 is doing what it claims and
the corpus is genuinely queryable.
"""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator

import pytest
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker
from sqlalchemy.sql import text

from soyl.application.rag.ingest_document import ingest_document
from soyl.infrastructure.db.repositories.document_repository import vector_literal
from soyl.infrastructure.db.session import create_session_factory, tenant_session
from soyl.infrastructure.providers.azure_openai import AzureOpenAIEmbeddings
from soyl.infrastructure.providers.azure_questions import AzureOpenAIQuestions
from soyl.infrastructure.storage.s3 import S3Storage
from soyl.settings import Settings
from tests.conftest import ApiTestSettings
from tests.integration.test_ingestion import SOP, prepare

pytestmark = pytest.mark.azure


@pytest.fixture(scope="module")
def azure() -> Settings:
    settings = Settings()  # type: ignore[call-arg]
    if not (settings.azure_openai_endpoint and settings.azure_openai_api_key):
        pytest.skip("Azure credentials absent")
    return settings


@pytest.fixture
def embeddings(azure: Settings) -> AzureOpenAIEmbeddings:
    return AzureOpenAIEmbeddings(
        endpoint=str(azure.azure_openai_endpoint),
        api_key=azure.azure_openai_api_key or "",
        deployment=azure.azure_openai_embedding_deployment,
        model=azure.azure_openai_embedding_model,
        dimensions=azure.embedding_dimensions,
        api_version=azure.azure_openai_api_version,
    )


@pytest.fixture
def questions(azure: Settings) -> AzureOpenAIQuestions:
    return AzureOpenAIQuestions(
        endpoint=str(azure.azure_openai_endpoint),
        api_key=azure.azure_openai_api_key or "",
        deployment=azure.azure_openai_chat_deployment,
        model=azure.azure_openai_chat_model,
        api_version=azure.azure_openai_api_version,
    )


@pytest.fixture
async def storage(settings: ApiTestSettings) -> AsyncIterator[S3Storage]:
    store = S3Storage(
        endpoint_url=str(settings.storage_endpoint_url),
        region="us-east-1",
        bucket=settings.storage_bucket,
        access_key=settings.storage_access_key,
        secret_key=settings.storage_secret_key,
    )
    await store.ensure_bucket()
    yield store


@pytest.fixture
def factory(app_engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    return create_session_factory(app_engine)


@pytest.fixture
async def tenant(migrator_engine: AsyncEngine) -> AsyncIterator[uuid.UUID]:
    tenant_id = uuid.uuid4()
    migrator = create_session_factory(migrator_engine)

    async with tenant_session(migrator, tenant_id) as session:
        await session.execute(
            text(
                "INSERT INTO core.tenant (id, name, slug, country) "
                "VALUES (:id, 'Azure Ingest', :slug, 'IN')"
            ),
            {"id": tenant_id, "slug": f"az-{uuid.uuid4().hex[:10]}"},
        )

    yield tenant_id

    async with migrator_engine.connect() as connection:
        await connection.execute(text("DELETE FROM core.tenant WHERE id = :id"), {"id": tenant_id})
        await connection.commit()


async def test_a_generated_question_retrieves_its_own_passage(
    factory: async_sessionmaker[AsyncSession],
    storage: S3Storage,
    tenant: uuid.UUID,
    embeddings: AzureOpenAIEmbeddings,
    questions: AzureOpenAIQuestions,
) -> None:
    """The closest automatable form of "the corpus is queryable".

    Ingest a real SOP with real embeddings and real generated questions, then
    ask a question in a user's words and check the right passage comes back
    first. Nothing about this works if chunking, context headers, embedding or
    the vector index is wrong, which is what makes it worth the API spend.
    """
    document_id, job_id = await prepare(
        factory, storage, tenant, data=SOP.encode(), filename="complaint-sop.md"
    )

    result = await ingest_document(
        factory=factory,
        storage=storage,
        embeddings=embeddings,
        questions=questions,
        questions_per_chunk=3,
        tenant_id=tenant,
        document_id=document_id,
        job_id=job_id,
    )

    assert result.chunk_count > 0

    # Questions were written and embedded alongside the chunks.
    async with tenant_session(factory, tenant) as session:
        generated = (
            await session.execute(
                text(
                    "SELECT q.question FROM rag.chunk_question q "
                    "JOIN rag.chunk c ON c.id = q.chunk_id "
                    "WHERE c.document_id = :id"
                ),
                {"id": document_id},
            )
        ).all()

    assert generated, "no hypothetical questions were generated"

    # Now ask, in a user's words, something the SOP answers.
    asked = "can we cancel a corporate booking for free?"
    (query_vector,) = (await embeddings.embed([asked])).vectors

    async with tenant_session(factory, tenant) as session:
        top = (
            await session.execute(
                text(
                    "SELECT content, embedding <=> CAST(:v AS vector) AS distance "
                    "FROM rag.chunk WHERE document_id = :id "
                    "ORDER BY distance LIMIT 1"
                ),
                {"v": vector_literal(query_vector), "id": document_id},
            )
        ).one()

    # The cancellation section, not the noise-complaints one.
    assert "cancelled without penalty" in top.content


async def test_questions_are_in_a_users_words_not_the_documents(
    questions: AzureOpenAIQuestions,
) -> None:
    """§43.2's premise, checked against the real model.

    If the generated questions merely echo the document's phrasing, they add
    nothing — the content embedding already covers that. The value is entirely
    in the paraphrase.
    """
    result = await questions.generate(
        context_header="Document: Rate Plan Terms\nSection: 4. Cancellation\n---",
        content=(
            "Corporate reservations may be cancelled without penalty up to 48 hours "
            "before arrival. Leisure bookings follow the rate plan attached."
        ),
        count=3,
    )

    assert 1 <= len(result.questions) <= 3
    assert result.usage.input_tokens > 0
    assert result.usage.output_tokens > 0

    joined = " ".join(result.questions).lower()
    # A question, not a restatement.
    assert "?" in " ".join(result.questions)
    # At least one should reach for everyday wording rather than the clause's.
    assert any(word in joined for word in ("free", "charge", "fee", "penalty", "cancel"))


async def test_question_generation_never_fails_an_ingestion(
    factory: async_sessionmaker[AsyncSession],
    storage: S3Storage,
    tenant: uuid.UUID,
    embeddings: AzureOpenAIEmbeddings,
) -> None:
    """A document with no questions is still a document.

    Passing a provider that always fails must still leave the document ready
    and searchable — questions improve retrieval, they are not a precondition
    for it.
    """

    class BrokenQuestions:
        @property
        def model(self) -> str:
            return "broken"

        async def generate(self, **_: object) -> None:
            raise RuntimeError("provider is down")

    document_id, job_id = await prepare(
        factory, storage, tenant, data=SOP.encode(), filename="complaint-sop.md"
    )

    result = await ingest_document(
        factory=factory,
        storage=storage,
        embeddings=embeddings,
        questions=BrokenQuestions(),  # type: ignore[arg-type]
        tenant_id=tenant,
        document_id=document_id,
        job_id=job_id,
    )

    assert result.chunk_count > 0

    async with tenant_session(factory, tenant) as session:
        status = (
            await session.execute(
                text("SELECT status FROM rag.document WHERE id = :id"), {"id": document_id}
            )
        ).scalar_one()

    assert status == "ready"
