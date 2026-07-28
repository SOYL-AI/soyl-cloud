"""Hybrid retrieval against a real corpus.

Real Postgres, real pgvector, real full-text index. The embedding provider is
the fake one, and that choice shapes what this file can and cannot assert.

**What it proves:** the plumbing. That three retrievers run, that pre-filtering
happens before the top-k cut, that lexical search finds exact identifiers
vector search would miss, that fusion combines them, that the threshold can
return nothing.

**What it cannot prove:** whether the results are *good*. Fake vectors are a
hash — semantically meaningless — so any assertion about "the right chunk came
first" would be measuring the hash. Quality is `test_retrieval_azure.py`
against the live deployment, and ultimately M4's labelled set.

Being explicit about that line matters, because a retrieval test that looks
like it measures quality and does not is worse than no test: it produces a
green tick that means nothing.
"""

from __future__ import annotations

import asyncio
import uuid
from collections.abc import AsyncIterator

import pytest
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker
from sqlalchemy.sql import text

from soyl.application.rag import retrieve as retrieve_module
from soyl.application.rag.ingest_document import ingest_document
from soyl.application.rag.retrieve import retrieve
from soyl.domain.ai.ports import ProviderError, Ranked, RerankResult, Usage
from soyl.infrastructure.db.session import create_session_factory, tenant_session
from soyl.infrastructure.providers.fake import FakeEmbeddings
from soyl.infrastructure.providers.fake_questions import FakeQuestions
from soyl.infrastructure.providers.fake_rerank import FakeRerank
from soyl.infrastructure.storage.s3 import S3Storage
from tests.conftest import ApiTestSettings
from tests.integration.test_ingestion import prepare

# Deliberately contains both kinds of query target: paraphrasable prose, and
# exact identifiers (a vendor name, a contract number) that only lexical search
# can reach.
CORPUS = """# Supplier Agreements

## 1. Laundry — Sparkle Linens Pvt Ltd

Contract reference SL-2026-114. Sparkle Linens collects at 07:00 daily and
returns finished linen within 24 hours. Delays beyond 36 hours are escalated to
procurement and attract a service credit.

## 2. Cancellation terms

Corporate reservations may be cancelled without penalty up to 48 hours before
arrival. Leisure bookings follow the rate plan attached to the reservation.

## 3. Housekeeping standards

Departure rooms are stripped, cleaned and inspected within 45 minutes. The
supervisor signs off every inspection in the duty log.

## 4. Fire safety

Assembly is at the front car park. The duty manager takes the guest register
and confirms every room has been cleared before reporting to the fire officer.
"""


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
async def corpus(
    app_factory: async_sessionmaker[AsyncSession],
    storage: S3Storage,
    migrator_engine: AsyncEngine,
) -> AsyncIterator[uuid.UUID]:
    """A tenant with one ingested document."""
    tenant_id = uuid.uuid4()
    migrator = create_session_factory(migrator_engine)

    async with tenant_session(migrator, tenant_id) as session:
        await session.execute(
            text(
                "INSERT INTO core.tenant (id, name, slug, country) "
                "VALUES (:id, 'Retrieval Test', :slug, 'IN')"
            ),
            {"id": tenant_id, "slug": f"ret-{uuid.uuid4().hex[:10]}"},
        )

    document_id, job_id = await prepare(
        app_factory, storage, tenant_id, data=CORPUS.encode(), filename="suppliers.md"
    )
    await ingest_document(
        factory=app_factory,
        storage=storage,
        embeddings=FakeEmbeddings(),
        questions=FakeQuestions(),
        tenant_id=tenant_id,
        document_id=document_id,
        job_id=job_id,
    )

    yield tenant_id

    async with migrator_engine.connect() as connection:
        await connection.execute(text("DELETE FROM core.tenant WHERE id = :id"), {"id": tenant_id})
        await connection.commit()


# ── The plumbing ────────────────────────────────────────────────────────────


async def test_retrieval_returns_chunks_with_their_content(
    app_factory: async_sessionmaker[AsyncSession], corpus: uuid.UUID
) -> None:
    async with tenant_session(app_factory, corpus) as session:
        result = await retrieve(
            session, embeddings=FakeEmbeddings(), query="laundry turnaround time"
        )

    assert result.chunks
    assert all(chunk.content for chunk in result.chunks)
    assert all(chunk.document_title == "suppliers.md" for chunk in result.chunks)


async def test_lexical_search_finds_an_exact_identifier(
    app_factory: async_sessionmaker[AsyncSession], corpus: uuid.UUID
) -> None:
    """The half of hybrid retrieval that vector search cannot do.

    "SL-2026-114" is a contract reference. An embedding of it is meaningless;
    a token match is exact. §45.1 calls fusing these a correctness requirement
    rather than an optimisation, and this is why.
    """
    async with tenant_session(app_factory, corpus) as session:
        result = await retrieve(session, embeddings=FakeEmbeddings(), query="SL-2026-114")

    assert result.chunks
    assert any("SL-2026-114" in chunk.content for chunk in result.chunks)


async def test_a_vendor_name_is_found_by_token_not_by_meaning(
    app_factory: async_sessionmaker[AsyncSession], corpus: uuid.UUID
) -> None:
    async with tenant_session(app_factory, corpus) as session:
        result = await retrieve(session, embeddings=FakeEmbeddings(), query="Sparkle Linens")

    assert any("Sparkle Linens" in chunk.content for chunk in result.chunks)


async def test_every_result_records_which_retrievers_found_it(
    app_factory: async_sessionmaker[AsyncSession], corpus: uuid.UUID
) -> None:
    """`ai.retrieval_log` stores this and the M6 inspector renders it.

    §7: without it, "why did it give that answer" is unanswerable — and that is
    the question we will be asked most often.
    """
    async with tenant_session(app_factory, corpus) as session:
        result = await retrieve(session, embeddings=FakeEmbeddings(), query="laundry")

    assert result.fused
    assert all(entry.ranks for entry in result.fused)
    assert {name for entry in result.fused for name in entry.ranks} <= {
        "vector",
        "lexical",
        "questions",
    }


async def test_the_top_k_is_respected(
    app_factory: async_sessionmaker[AsyncSession], corpus: uuid.UUID
) -> None:
    async with tenant_session(app_factory, corpus) as session:
        result = await retrieve(
            session, embeddings=FakeEmbeddings(), query="housekeeping", top_k=2
        )

    assert len(result.chunks) <= 2


async def test_chunks_come_back_in_fused_order(
    app_factory: async_sessionmaker[AsyncSession], corpus: uuid.UUID
) -> None:
    """Postgres returns rows in whatever order suits it.

    Losing the ranking after fusing would discard the entire point of fusing.
    """
    async with tenant_session(app_factory, corpus) as session:
        result = await retrieve(session, embeddings=FakeEmbeddings(), query="cancellation")

    assert [chunk.chunk_id for chunk in result.chunks] == [
        entry.chunk_id for entry in result.fused
    ]


# ── Property scoping ────────────────────────────────────────────────────────
#
# This is where the first real bug in the repository lived: `:property_ids IS
# NULL` gave asyncpg nothing to infer a type from, and every unscoped query —
# the common case — failed outright. The tests below cover the other half, the
# scoped case, because a filter that silently *over*-returns fails quietly
# instead of loudly, and would leak one hotel's operating procedure into
# another's answers within the same group.


@pytest.fixture
async def scoped(
    app_factory: async_sessionmaker[AsyncSession],
    storage: S3Storage,
    corpus: uuid.UUID,
) -> tuple[uuid.UUID, uuid.UUID]:
    """Two hotels in the same group, and a document belonging to only one."""
    beach, hills = uuid.uuid4(), uuid.uuid4()

    async with tenant_session(app_factory, corpus) as session:
        for property_id, name in ((beach, "Beach"), (hills, "Hills")):
            await session.execute(
                text(
                    "INSERT INTO core.property (id, tenant_id, name, rooms_total) "
                    "VALUES (:id, :tenant_id, :name, 40)"
                ),
                {"id": property_id, "tenant_id": corpus, "name": name},
            )

    document_id, job_id = await prepare(
        app_factory,
        storage,
        corpus,
        data=b"# Beach only\n\nThe kayak hire desk opens at 08:00 and closes at sunset.\n",
        filename="beach.md",
    )
    async with tenant_session(app_factory, corpus) as session:
        await session.execute(
            text("UPDATE rag.document SET property_ids = :ids WHERE id = :id"),
            {"ids": [beach], "id": document_id},
        )

    await ingest_document(
        factory=app_factory,
        storage=storage,
        embeddings=FakeEmbeddings(),
        questions=FakeQuestions(),
        tenant_id=corpus,
        document_id=document_id,
        job_id=job_id,
    )

    return beach, hills


async def test_a_property_scoped_document_is_hidden_from_another_property(
    app_factory: async_sessionmaker[AsyncSession],
    corpus: uuid.UUID,
    scoped: tuple[uuid.UUID, uuid.UUID],
) -> None:
    _, hills = scoped

    async with tenant_session(app_factory, corpus) as session:
        result = await retrieve(
            session, embeddings=FakeEmbeddings(), query="kayak hire desk", property_ids=[hills]
        )

    assert all(chunk.document_title != "beach.md" for chunk in result.chunks)


async def test_a_property_scoped_document_is_visible_to_its_own_property(
    app_factory: async_sessionmaker[AsyncSession],
    corpus: uuid.UUID,
    scoped: tuple[uuid.UUID, uuid.UUID],
) -> None:
    beach, _ = scoped

    async with tenant_session(app_factory, corpus) as session:
        result = await retrieve(
            session, embeddings=FakeEmbeddings(), query="kayak hire desk", property_ids=[beach]
        )

    assert any(chunk.document_title == "beach.md" for chunk in result.chunks)


async def test_group_wide_documents_stay_visible_under_a_property_scope(
    app_factory: async_sessionmaker[AsyncSession],
    corpus: uuid.UUID,
    scoped: tuple[uuid.UUID, uuid.UUID],
) -> None:
    """The easy mistake: scoping to a property hiding everything unscoped.

    A group cancellation policy is attached to no single hotel. If narrowing to
    one made it invisible, every property-scoped question would be answered
    from a corpus missing all the group's actual policy.
    """
    _, hills = scoped

    async with tenant_session(app_factory, corpus) as session:
        result = await retrieve(
            session,
            embeddings=FakeEmbeddings(),
            query="cancellation SL-2026-114",
            property_ids=[hills],
        )

    assert any(chunk.document_title == "suppliers.md" for chunk in result.chunks)


# ── The right to find nothing ───────────────────────────────────────────────


async def test_an_empty_query_retrieves_nothing_rather_than_everything(
    app_factory: async_sessionmaker[AsyncSession], corpus: uuid.UUID
) -> None:
    async with tenant_session(app_factory, corpus) as session:
        result = await retrieve(session, embeddings=FakeEmbeddings(), query="   ")

    assert result.found_nothing


async def test_an_impossible_threshold_returns_nothing(
    app_factory: async_sessionmaker[AsyncSession], corpus: uuid.UUID
) -> None:
    """§8's most important behaviour, exercised directly.

    "I don't have anything on that" must be reachable. A pipeline that cannot
    return zero chunks will always answer from the nearest ones, which is the
    failure that makes people stop trusting the product.
    """
    async with tenant_session(app_factory, corpus) as session:
        result = await retrieve(
            session, embeddings=FakeEmbeddings(), query="laundry", min_score=999.0
        )

    assert result.found_nothing
    # And it still records what it considered, so the M6 inspector can show
    # that the pipeline looked rather than that nothing happened.
    assert result.fused


# ── Reranking ───────────────────────────────────────────────────────────────
#
# Reranking is a quality stage, not a correctness one. Every test here is about
# what happens when it *doesn't* work, because that is the path that runs on a
# bad day and the one nobody exercises by hand.


class Hangs:
    """A reranker that never returns. Stands in for a wedged provider."""

    model = "hangs"

    async def rerank(self, *, query: str, documents: list[str], top_n: int) -> RerankResult:
        await asyncio.sleep(60)
        raise AssertionError("unreachable")


class Fails:
    """A reranker that is down."""

    model = "fails"

    async def rerank(self, *, query: str, documents: list[str], top_n: int) -> RerankResult:
        raise ProviderError("rerank provider returned 503", retryable=True)


class Lies:
    """A reranker that returns a confident ranking over indices it invented."""

    model = "lies"

    async def rerank(self, *, query: str, documents: list[str], top_n: int) -> RerankResult:
        return RerankResult(
            results=[Ranked(index=-1, score=1.0), Ranked(index=9999, score=0.9)],
            usage=Usage(provider="fake", model=self.model),
        )


class Rejects:
    """A reranker that finds nothing good enough."""

    model = "rejects"

    async def rerank(self, *, query: str, documents: list[str], top_n: int) -> RerankResult:
        return RerankResult(
            results=[Ranked(index=index, score=0.05) for index in range(len(documents))],
            usage=Usage(provider="fake", model=self.model),
        )


async def test_reranking_marks_the_result_as_reranked(
    app_factory: async_sessionmaker[AsyncSession], corpus: uuid.UUID
) -> None:
    async with tenant_session(app_factory, corpus) as session:
        result = await retrieve(
            session,
            embeddings=FakeEmbeddings(),
            reranker=FakeRerank(),
            query="cancellation of a corporate booking",
        )

    assert result.reranked
    assert result.rerank_skipped_reason is None
    assert len(result.scores) == len(result.chunks)


async def test_a_hanging_reranker_falls_back_to_fusion_order(
    app_factory: async_sessionmaker[AsyncSession],
    corpus: uuid.UUID,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """§45.3: skipped for that turn, fusion order used, with an annotation.

    The budget is patched down so the test does not sit for twelve seconds —
    what is being asserted is the fallback, not the duration.
    """
    monkeypatch.setattr(retrieve_module, "RERANK_BUDGET_SECONDS", 0.1)

    async with tenant_session(app_factory, corpus) as session:
        result = await retrieve(
            session, embeddings=FakeEmbeddings(), reranker=Hangs(), query="cancellation"
        )

    assert result.chunks, "a slow reranker must not cost the user their answer"
    assert not result.reranked
    assert result.rerank_skipped_reason is not None
    assert "budget" in result.rerank_skipped_reason


async def test_a_failing_reranker_falls_back_to_fusion_order(
    app_factory: async_sessionmaker[AsyncSession], corpus: uuid.UUID
) -> None:
    async with tenant_session(app_factory, corpus) as session:
        result = await retrieve(
            session, embeddings=FakeEmbeddings(), reranker=Fails(), query="cancellation"
        )

    assert result.chunks
    assert not result.reranked
    assert result.rerank_skipped_reason is not None
    assert "503" in result.rerank_skipped_reason


async def test_invented_indices_never_reach_a_citation(
    app_factory: async_sessionmaker[AsyncSession], corpus: uuid.UUID
) -> None:
    """The quiet failure the port's docstring warns about.

    `-1` is a valid Python list index. Trusting it would return a real chunk,
    from the other end of the candidate list, with a real citation — an answer
    that looks correct and sources the wrong document.
    """
    async with tenant_session(app_factory, corpus) as session:
        result = await retrieve(
            session, embeddings=FakeEmbeddings(), reranker=Lies(), query="cancellation"
        )

    assert result.found_nothing


async def test_nothing_clearing_the_rerank_threshold_returns_nothing(
    app_factory: async_sessionmaker[AsyncSession], corpus: uuid.UUID
) -> None:
    """§45.3's stance, and the reason the threshold exists at all.

    Retrieval found candidates and the reranker judged all of them weak. The
    honest outcome is zero chunks, not the best of a bad set — this is the same
    behaviour as "nothing in the corpus covers that", reached a different way.
    """
    async with tenant_session(app_factory, corpus) as session:
        result = await retrieve(
            session, embeddings=FakeEmbeddings(), reranker=Rejects(), query="cancellation"
        )

    assert result.found_nothing
    assert result.reranked, "it ran and rejected everything; that is not a skip"
    assert result.rerank_skipped_reason is None


async def test_no_reranker_is_not_recorded_as_a_skipped_one(
    app_factory: async_sessionmaker[AsyncSession], corpus: uuid.UUID
) -> None:
    """"Never configured" and "failed today" must be distinguishable.

    Both give fusion order. Only one is worth waking up for.
    """
    async with tenant_session(app_factory, corpus) as session:
        result = await retrieve(session, embeddings=FakeEmbeddings(), query="cancellation")

    assert result.chunks
    assert not result.reranked
    assert result.rerank_skipped_reason is None


async def test_usage_is_collected_from_every_model_call(
    app_factory: async_sessionmaker[AsyncSession], corpus: uuid.UUID
) -> None:
    """§6.6: the usage ledger from the first model call.

    Retrieval makes two — an embedding and a rerank — and both have to reach
    the caller, because a cost the caller never sees is a cost nobody bills.
    """
    async with tenant_session(app_factory, corpus) as session:
        result = await retrieve(
            session, embeddings=FakeEmbeddings(), reranker=FakeRerank(), query="cancellation"
        )

    assert len(result.usage) == 2


async def test_a_failed_rerank_still_reports_the_embedding_it_paid_for(
    app_factory: async_sessionmaker[AsyncSession], corpus: uuid.UUID
) -> None:
    """The embedding was bought before the reranker failed, so it is owed."""
    async with tenant_session(app_factory, corpus) as session:
        result = await retrieve(
            session, embeddings=FakeEmbeddings(), reranker=Fails(), query="cancellation"
        )

    assert len(result.usage) == 1


# ── Isolation ───────────────────────────────────────────────────────────────


async def test_retrieval_cannot_reach_another_tenants_corpus(
    app_factory: async_sessionmaker[AsyncSession], corpus: uuid.UUID
) -> None:
    """Retrieval is the path a leak would actually take.

    Every other route asks for a document by id; this one asks for whatever is
    most relevant, which is exactly the query that would surface a neighbour's
    contract if the policy were missing.
    """
    stranger = uuid.uuid4()

    async with tenant_session(app_factory, stranger) as session:
        result = await retrieve(
            session, embeddings=FakeEmbeddings(), query="Sparkle Linens SL-2026-114"
        )

    assert result.found_nothing
    assert result.fused == []
