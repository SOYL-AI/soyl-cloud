"""The answer pipeline, end to end against real Postgres.

Fake providers, so nothing here measures answer quality — that is the eval set
in `evals/`. What it measures is that the pipeline records what it must:
`UPDATE.md` §6.5 (every question, permanently), §6.6 (the usage ledger) and §7
(the retrieval log). All three are the kind of requirement that is satisfied on
the happy path and quietly skipped when something fails, which is exactly when
the record matters.
"""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator

import pytest
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker
from sqlalchemy.sql import text

from soyl.application.ai.answer import AnswerRefused, answer_question
from soyl.application.rag.ingest_document import ingest_document
from soyl.domain.ai.envelope import DraftAnswer, DraftBlock
from soyl.domain.ai.ports import ProviderError, Usage
from soyl.domain.rag.retrieval import RetrievedChunk
from soyl.infrastructure.db.session import create_session_factory, tenant_session
from soyl.infrastructure.providers.fake import FakeEmbeddings
from soyl.infrastructure.providers.fake_answers import FakeAnswers
from soyl.infrastructure.providers.fake_questions import FakeQuestions
from soyl.infrastructure.providers.fake_rerank import FakeRerank
from soyl.infrastructure.storage.s3 import S3Storage
from tests.conftest import ApiTestSettings
from tests.integration.test_ingestion import prepare

CORPUS = """# Front Office SOP

## 1. Cancellation and no-show

A room booked under a corporate contracted rate may be withdrawn without charge
up to 48 hours before the arrival date. Inside 48 hours, and for a guest who
does not arrive, one night's room and applicable tax is charged.

## 2. Late departure

Standard departure time is 11:00. Beyond 13:00 the room is charged at fifty per
cent of the room-only rate up to 18:00, and as a full additional night after.
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
async def tenant(
    app_factory: async_sessionmaker[AsyncSession],
    storage: S3Storage,
    migrator_engine: AsyncEngine,
) -> AsyncIterator[tuple[uuid.UUID, uuid.UUID]]:
    """A tenant with one ingested document and one user."""
    tenant_id = uuid.uuid4()
    user_id = uuid.uuid4()
    migrator = create_session_factory(migrator_engine)

    async with migrator() as session, session.begin():
        await session.execute(
            text(
                "INSERT INTO core.user_account (id, email, display_name) "
                "VALUES (:id, :email, 'Answer Test')"
            ),
            {"id": user_id, "email": f"answers-{uuid.uuid4().hex[:8]}@example.test"},
        )

    async with tenant_session(migrator, tenant_id) as session:
        await session.execute(
            text(
                "INSERT INTO core.tenant (id, name, slug, country) "
                "VALUES (:id, 'Answer Test', :slug, 'IN')"
            ),
            {"id": tenant_id, "slug": f"ans-{uuid.uuid4().hex[:10]}"},
        )

    document_id, job_id = await prepare(
        app_factory, storage, tenant_id, data=CORPUS.encode(), filename="front-office.md"
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

    yield tenant_id, user_id

    async with migrator_engine.connect() as connection:
        await connection.execute(text("DELETE FROM core.tenant WHERE id = :id"), {"id": tenant_id})
        await connection.execute(
            text("DELETE FROM core.user_account WHERE id = :id"), {"id": user_id}
        )
        await connection.commit()


async def ask(
    factory: async_sessionmaker[AsyncSession],
    tenant: tuple[uuid.UUID, uuid.UUID],
    question: str,
    *,
    answers: object | None = None,
):
    tenant_id, user_id = tenant
    return await answer_question(
        factory,
        embeddings=FakeEmbeddings(),
        answers=answers or FakeAnswers(),  # type: ignore[arg-type]
        reranker=FakeRerank(),
        tenant_id=tenant_id,
        user_id=user_id,
        question=question,
    )


# ── The happy path, and what it must record ─────────────────────────────────


async def test_an_answer_carries_blocks_and_cited_sources(
    app_factory: async_sessionmaker[AsyncSession], tenant: tuple[uuid.UUID, uuid.UUID]
) -> None:
    outcome = await ask(app_factory, tenant, "can a company cancel without paying?")

    assert outcome.envelope.status == "complete"
    assert outcome.envelope.blocks
    assert outcome.envelope.provenance.documents
    assert outcome.envelope.summary.headline


async def test_every_cited_source_was_actually_retrieved(
    app_factory: async_sessionmaker[AsyncSession], tenant: tuple[uuid.UUID, uuid.UUID]
) -> None:
    """The property the whole product rests on, asserted end to end."""
    outcome = await ask(app_factory, tenant, "cancellation")

    async with tenant_session(app_factory, tenant[0]) as session:
        rows = (
            await session.execute(
                text("SELECT chunk_ids FROM ai.retrieval_log WHERE turn_id = :id"),
                {"id": outcome.turn_id},
            )
        ).scalar_one()

    retrieved = {uuid.UUID(str(chunk_id)) for chunk_id in rows}
    assert outcome.envelope.cited_chunk_ids <= retrieved


async def test_the_question_is_logged_permanently(
    app_factory: async_sessionmaker[AsyncSession], tenant: tuple[uuid.UUID, uuid.UUID]
) -> None:
    """§6.5. The single most valuable artifact Phase 0 produces."""
    outcome = await ask(app_factory, tenant, "what is the late checkout charge?")

    async with tenant_session(app_factory, tenant[0]) as session:
        row = (
            await session.execute(
                text("SELECT input, status, envelope_id FROM ai.turn WHERE id = :id"),
                {"id": outcome.turn_id},
            )
        ).one()

    assert row.input == "what is the late checkout charge?"
    assert row.status == "complete"
    assert row.envelope_id is not None


async def test_the_retrieval_log_records_why_not_just_what(
    app_factory: async_sessionmaker[AsyncSession], tenant: tuple[uuid.UUID, uuid.UUID]
) -> None:
    """§7: without this, "why did it give that answer" is unanswerable."""
    outcome = await ask(app_factory, tenant, "corporate cancellation window")

    async with tenant_session(app_factory, tenant[0]) as session:
        row = (
            await session.execute(
                text(
                    "SELECT query, chunk_ids, scores, reranked, latency_ms "
                    "FROM ai.retrieval_log WHERE turn_id = :id"
                ),
                {"id": outcome.turn_id},
            )
        ).one()

    assert row.query == "corporate cancellation window"
    assert len(row.chunk_ids) == len(row.scores)
    assert row.reranked is True
    assert row.latency_ms is not None


async def test_every_model_call_reaches_the_usage_ledger(
    app_factory: async_sessionmaker[AsyncSession], tenant: tuple[uuid.UUID, uuid.UUID]
) -> None:
    """§6.6, and per call rather than per turn.

    A turn that embedded, reranked and synthesised spent money three times at
    three prices. One summed row cannot answer which of them is expensive,
    which is the only question the ledger exists to answer.
    """
    outcome = await ask(app_factory, tenant, "cancellation policy")

    async with tenant_session(app_factory, tenant[0]) as session:
        kinds = (
            await session.execute(
                text("SELECT kind FROM billing.usage_ledger WHERE turn_id = :id"),
                {"id": outcome.turn_id},
            )
        ).scalars().all()

    assert len(kinds) >= 2


async def test_a_conversation_accumulates_its_turns(
    app_factory: async_sessionmaker[AsyncSession], tenant: tuple[uuid.UUID, uuid.UUID]
) -> None:
    tenant_id, user_id = tenant
    first = await ask(app_factory, tenant, "cancellation")

    second = await answer_question(
        app_factory,
        embeddings=FakeEmbeddings(),
        answers=FakeAnswers(),
        reranker=FakeRerank(),
        tenant_id=tenant_id,
        user_id=user_id,
        question="and for late departure?",
        conversation_id=first.conversation_id,
    )

    assert second.conversation_id == first.conversation_id

    async with tenant_session(app_factory, tenant_id) as session:
        count = (
            await session.execute(
                text("SELECT turn_count FROM ai.conversation WHERE id = :id"),
                {"id": first.conversation_id},
            )
        ).scalar_one()

    assert count == 2


# ── Refusal ─────────────────────────────────────────────────────────────────


async def test_a_question_the_corpus_cannot_answer_produces_a_deliberate_refusal(
    app_factory: async_sessionmaker[AsyncSession], tenant: tuple[uuid.UUID, uuid.UUID]
) -> None:
    """§M4's acceptance criterion, and §9's "refusal is a valid outcome".

    The corpus is two sections about cancellation and departure. Nothing in it
    concerns wifi. The answer must say so rather than assemble something from
    the nearest passage.
    """
    outcome = await ask(app_factory, tenant, "zzzz qqqq wifi password conference room")

    assert outcome.envelope.status == "no_evidence"
    assert outcome.envelope.blocks, "a refusal is an answer, not an empty response"
    assert outcome.envelope.blocks[0].type == "alert.callout"
    assert outcome.envelope.provenance.documents == []


async def test_a_refused_turn_is_still_logged(
    app_factory: async_sessionmaker[AsyncSession], tenant: tuple[uuid.UUID, uuid.UUID]
) -> None:
    """The rows worth the most.

    "What did people ask that we could not answer" is the roadmap, so a turn
    that returned nothing has to be as durable as one that succeeded.
    """
    outcome = await ask(app_factory, tenant, "zzzz qqqq spa opening hours")

    async with tenant_session(app_factory, tenant[0]) as session:
        status = (
            await session.execute(
                text("SELECT status FROM ai.turn WHERE id = :id"), {"id": outcome.turn_id}
            )
        ).scalar_one()

    assert status == "no_evidence"


class Fabricates:
    """A synthesiser that cites a chunk it was never given."""

    model = "fabricates"

    async def synthesise(self, *, question: str, chunks: list[RetrievedChunk]):
        return (
            DraftAnswer(
                headline="Corporate bookings cancel free up to 24 hours before arrival.",
                blocks=[
                    DraftBlock(
                        type="text.markdown",
                        markdown="The window is 24 hours.",
                        provenance=[str(uuid.uuid4())],
                    )
                ],
            ),
            Usage(provider="fake", model=self.model),
        )


async def test_a_fabricated_citation_never_reaches_the_user(
    app_factory: async_sessionmaker[AsyncSession], tenant: tuple[uuid.UUID, uuid.UUID]
) -> None:
    """§6.4, proven through the whole pipeline rather than in the validator.

    The claim is wrong — the window is 48 hours, not 24 — and it cites a
    plausible UUID that retrieval never returned. It is stripped, and because
    nothing survives, the turn becomes an honest refusal rather than a
    confident falsehood.

    The assertion is against the whole serialised envelope rather than against
    `blocks`, and that is what made it useful: the first version of this
    pipeline stripped the block correctly and left "cancel free up to 24 hours"
    in `summary.headline`, which is the field lists and notifications render.
    Checking only the blocks would have passed.
    """
    outcome = await ask(app_factory, tenant, "cancellation window", answers=Fabricates())

    assert "24 hours" not in str(outcome.envelope.model_dump())
    assert outcome.envelope.diagnostics.stripped_blocks == 1
    assert outcome.envelope.diagnostics.degraded
    assert outcome.envelope.status == "no_evidence"


class Fails:
    model = "fails"

    async def synthesise(self, *, question: str, chunks: list[RetrievedChunk]):
        raise ProviderError("answer provider returned 503", retryable=True)


async def test_a_provider_failure_still_leaves_the_question_recorded(
    app_factory: async_sessionmaker[AsyncSession], tenant: tuple[uuid.UUID, uuid.UUID]
) -> None:
    """The turn row is written before the model is called, for this reason."""
    tenant_id, user_id = tenant

    with pytest.raises(ProviderError):
        await answer_question(
            app_factory,
            embeddings=FakeEmbeddings(),
            answers=Fails(),  # type: ignore[arg-type]
            reranker=FakeRerank(),
            tenant_id=tenant_id,
            user_id=user_id,
            question="cancellation policy for corporate guests",
        )

    async with tenant_session(app_factory, tenant_id) as session:
        row = (
            await session.execute(
                text(
                    "SELECT input, status FROM ai.turn "
                    "WHERE tenant_id = :t ORDER BY started_at DESC LIMIT 1"
                ),
                {"t": tenant_id},
            )
        ).one()

    assert row.input == "cancellation policy for corporate guests"
    assert row.status == "failed"


# ── Guard ───────────────────────────────────────────────────────────────────


async def test_an_empty_question_is_refused_before_anything_is_spent(
    app_factory: async_sessionmaker[AsyncSession], tenant: tuple[uuid.UUID, uuid.UUID]
) -> None:
    with pytest.raises(AnswerRefused):
        await ask(app_factory, tenant, "   ")


async def test_a_pasted_document_is_refused_rather_than_embedded(
    app_factory: async_sessionmaker[AsyncSession], tenant: tuple[uuid.UUID, uuid.UUID]
) -> None:
    """Someone will paste a contract into the question box.

    Embedding it would cost real money for a query that cannot work, so the
    guard rejects it and says to upload it as a document instead.
    """
    with pytest.raises(AnswerRefused, match="limited to"):
        await ask(app_factory, tenant, "x" * 5000)


# ── Isolation ───────────────────────────────────────────────────────────────


async def test_a_conversation_cannot_be_continued_by_another_tenant(
    app_factory: async_sessionmaker[AsyncSession],
    tenant: tuple[uuid.UUID, uuid.UUID],
    migrator_engine: AsyncEngine,
) -> None:
    """RLS makes another tenant's conversation invisible rather than forbidden.

    So the correct behaviour is to start a new one, not to raise — and
    certainly not to append. Appending would put one tenant's question inside
    another's conversation.
    """
    first = await ask(app_factory, tenant, "cancellation")

    stranger = uuid.uuid4()
    stranger_user = uuid.uuid4()
    migrator = create_session_factory(migrator_engine)
    async with migrator() as session, session.begin():
        await session.execute(
            text(
                "INSERT INTO core.user_account (id, email, display_name) "
                "VALUES (:id, :email, 'Stranger')"
            ),
            {"id": stranger_user, "email": f"s-{uuid.uuid4().hex[:8]}@example.test"},
        )
    async with tenant_session(migrator, stranger) as session:
        await session.execute(
            text(
                "INSERT INTO core.tenant (id, name, slug, country) "
                "VALUES (:id, 'Stranger', :slug, 'IN')"
            ),
            {"id": stranger, "slug": f"str-{uuid.uuid4().hex[:10]}"},
        )

    try:
        outcome = await answer_question(
            app_factory,
            embeddings=FakeEmbeddings(),
            answers=FakeAnswers(),
            reranker=FakeRerank(),
            tenant_id=stranger,
            user_id=stranger_user,
            question="cancellation",
            conversation_id=first.conversation_id,
        )

        assert outcome.conversation_id != first.conversation_id
        # And the stranger's corpus is empty, so there is nothing to answer from.
        assert outcome.envelope.status == "no_evidence"
    finally:
        async with migrator_engine.connect() as connection:
            await connection.execute(
                text("DELETE FROM core.tenant WHERE id = :id"), {"id": stranger}
            )
            await connection.execute(
                text("DELETE FROM core.user_account WHERE id = :id"), {"id": stranger_user}
            )
            await connection.commit()


# ── History ─────────────────────────────────────────────────────────────────


async def test_a_conversation_is_listed_after_its_first_turn(
    app_factory: async_sessionmaker[AsyncSession], tenant: tuple[uuid.UUID, uuid.UUID]
) -> None:
    from soyl.infrastructure.db.repositories.answer_repository import AnswerRepository

    outcome = await ask(app_factory, tenant, "what is the cancellation window?")

    async with tenant_session(app_factory, tenant[0]) as session:
        rows = await AnswerRepository(session).list_conversations()

    assert [row.id for row in rows] == [outcome.conversation_id]
    assert rows[0].turn_count == 1
    # Titled from the question, not from a model call. It is what the user will
    # recognise in a list, and a title is not worth an inference.
    assert rows[0].title == "what is the cancellation window?"


async def test_loading_a_conversation_returns_its_turns_with_envelopes(
    app_factory: async_sessionmaker[AsyncSession], tenant: tuple[uuid.UUID, uuid.UUID]
) -> None:
    from soyl.infrastructure.db.repositories.answer_repository import AnswerRepository

    tenant_id, user_id = tenant
    first = await ask(app_factory, tenant, "cancellation")
    await answer_question(
        app_factory,
        embeddings=FakeEmbeddings(),
        answers=FakeAnswers(),
        reranker=FakeRerank(),
        tenant_id=tenant_id,
        user_id=user_id,
        question="and late departure?",
        conversation_id=first.conversation_id,
    )

    async with tenant_session(app_factory, tenant_id) as session:
        turns = await AnswerRepository(session).load_conversation(first.conversation_id)

    assert [turn.question for turn in turns] == ["cancellation", "and late departure?"]
    assert all(turn.envelope is not None for turn in turns)
    # Ordered by when they were asked, so a conversation reads as it happened.
    assert turns[0].asked_at <= turns[1].asked_at


async def test_a_failed_turn_stays_in_the_history_without_an_envelope(
    app_factory: async_sessionmaker[AsyncSession], tenant: tuple[uuid.UUID, uuid.UUID]
) -> None:
    """A LEFT JOIN, not an inner one.

    Dropping a failed turn would make the record disagree with what the user
    remembers asking — and the turns that failed are the ones worth finding.
    """
    from soyl.infrastructure.db.repositories.answer_repository import AnswerRepository

    tenant_id, user_id = tenant
    first = await ask(app_factory, tenant, "cancellation")

    with pytest.raises(ProviderError):
        await answer_question(
            app_factory,
            embeddings=FakeEmbeddings(),
            answers=Fails(),  # type: ignore[arg-type]
            reranker=FakeRerank(),
            tenant_id=tenant_id,
            user_id=user_id,
            question="this one will fail",
            conversation_id=first.conversation_id,
        )

    async with tenant_session(app_factory, tenant_id) as session:
        turns = await AnswerRepository(session).load_conversation(first.conversation_id)

    failed = [turn for turn in turns if turn.question == "this one will fail"]
    assert len(failed) == 1
    assert failed[0].status == "failed"
    assert failed[0].envelope is None


async def test_history_is_invisible_to_another_tenant(
    app_factory: async_sessionmaker[AsyncSession], tenant: tuple[uuid.UUID, uuid.UUID]
) -> None:
    """The question text itself is confidential.

    A conversation title is the question somebody typed, which can name a
    contract, a guest complaint or a supplier dispute. Listing across tenants
    would leak that without ever exposing an answer.
    """
    from soyl.infrastructure.db.repositories.answer_repository import AnswerRepository

    first = await ask(app_factory, tenant, "cancellation")

    async with tenant_session(app_factory, uuid.uuid4()) as session:
        repository = AnswerRepository(session)
        assert await repository.list_conversations() == []
        assert await repository.load_conversation(first.conversation_id) == []


class RefusesInProse:
    """A synthesiser that is handed chunks and correctly declines to use them.

    The real behaviour of `gpt-5.4-mini` on a question the corpus does not
    cover: retrieval returns something weakly related, and the model says so
    rather than answering from it.
    """

    model = "refuses"

    async def synthesise(self, *, question: str, chunks: list[RetrievedChunk]):
        return (
            DraftAnswer(
                headline="The documents do not cover the airport pickup price.",
                blocks=[
                    DraftBlock(
                        type="alert.callout",
                        level="info",
                        markdown="Nothing here covers guest transport charges.",
                    )
                ],
            ),
            Usage(provider="fake", model=self.model),
        )


async def test_a_synthesiser_refusal_is_recorded_as_a_refusal(
    app_factory: async_sessionmaker[AsyncSession], tenant: tuple[uuid.UUID, uuid.UUID]
) -> None:
    """Found by the end-to-end eval, and it was a product bug not a metric one.

    Retrieval returns weakly related chunks, so `had_evidence` is true. The
    refusal is an alert, and alerts are exempt from provenance, so it survives
    validation and `kept` is non-empty. Both original conditions passed and the
    turn was written as `complete`.

    That matters beyond a number: `ai.turn` is the permanent question log, and
    §6.5 exists to answer "what did people ask that we could not answer". Every
    synthesiser-level refusal was invisible to that query — and those are the
    ones most worth reading, because the corpus nearly covered them.
    """
    outcome = await ask(app_factory, tenant, "how much is the airport pickup", answers=RefusesInProse())

    assert outcome.envelope.status == "no_evidence"
    assert outcome.envelope.provenance.documents == []

    async with tenant_session(app_factory, tenant[0]) as session:
        status = (
            await session.execute(
                text("SELECT status FROM ai.turn WHERE id = :id"), {"id": outcome.turn_id}
            )
        ).scalar_one()

    # The roadmap query is `WHERE status IN ('no_evidence', 'refused', 'failed')`.
    assert status == "no_evidence"


async def test_a_cited_answer_is_still_complete(
    app_factory: async_sessionmaker[AsyncSession], tenant: tuple[uuid.UUID, uuid.UUID]
) -> None:
    """The guard must not swallow real answers.

    A rule that marked everything `no_evidence` would satisfy the test above
    and destroy the product.
    """
    outcome = await ask(app_factory, tenant, "corporate cancellation window")

    assert outcome.envelope.status == "complete"
    assert outcome.envelope.provenance.documents
