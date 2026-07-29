"""Asking a question.

Two routes over one pipeline:

- `POST /v1/answers` returns the whole envelope. Simple to call, easy to test,
  and what anything server-to-server should use.
- `POST /v1/answers/stream` emits the same envelope over SSE (§9's `stream`
  stage), so the browser can show progress instead of a spinner.

The stream emits *stages*, not tokens. Phase 0's synthesiser is a single
structured-output call that produces a whole envelope — there is no partial
envelope to send, because a half-parsed JSON object is not a renderable answer.
Pretending otherwise by streaming characters would mean the client either
buffers them all anyway or renders something the validator has not seen yet,
and the validator is the reason any of this is trustworthy.

So what streams is honest: retrieval finished, N sources found, synthesising,
done. That turns dead time into visible progress without shipping unvalidated
content, and when token streaming becomes worth it the event names already
exist.
"""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from soyl.application.ai.answer import AnswerRefused, answer_question
from soyl.domain.ai.envelope import Envelope
from soyl.domain.ai.ports import AnswerProvider, EmbeddingProvider, ProviderError, RerankProvider
from soyl.interface.http.authenticated import AuthedRequest
from soyl.interface.http.deps import (
    get_answers,
    get_embeddings,
    get_reranker,
    get_session_factory,
)
from soyl.interface.http.sse import event, stream

router = APIRouter(prefix="/v1/answers", tags=["answers"])

Embeddings = Annotated[EmbeddingProvider, Depends(get_embeddings)]
Answers = Annotated[AnswerProvider, Depends(get_answers)]
Reranker = Annotated[RerankProvider, Depends(get_reranker)]
Factory = Annotated["async_sessionmaker[AsyncSession]", Depends(get_session_factory)]


class AskRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    question: str = Field(min_length=1, max_length=4000)
    conversation_id: uuid.UUID | None = None
    property_ids: list[uuid.UUID] = Field(default_factory=list)
    # Lets a client retry a dropped connection without paying twice.
    idempotency_key: str | None = Field(default=None, max_length=120)


class AskResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    turn_id: uuid.UUID
    conversation_id: uuid.UUID
    envelope: Envelope


@router.post("", response_model=AskResponse)
async def ask(
    payload: AskRequest,
    request: AuthedRequest,
    factory: Factory,
    embeddings: Embeddings,
    answers: Answers,
    reranker: Reranker,
) -> AskResponse:
    request.require("documents:read")

    # A principal scoped to particular properties cannot widen that by asking.
    # Without this, `property_ids` would be a parameter that grants access
    # rather than one that narrows it.
    wanted = payload.property_ids or None
    if wanted:
        allowed = [p for p in wanted if request.principal.may_use_property(p)]
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to those properties.",
            )
        wanted = allowed

    try:
        outcome = await answer_question(
            factory,
            embeddings=embeddings,
            answers=answers,
            reranker=reranker,
            tenant_id=request.principal.tenant_id,
            user_id=request.principal.user_id,
            question=payload.question,
            conversation_id=payload.conversation_id,
            property_ids=wanted,
            idempotency_key=payload.idempotency_key,
        )
    except AnswerRefused as refused:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(refused)
        ) from refused
    except ProviderError as error:
        # 503 rather than 500: the pipeline is fine and the provider is not, so
        # retrying is the right client behaviour and this says so.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The model provider is unavailable. Try again in a moment.",
        ) from error

    return AskResponse(
        turn_id=outcome.turn_id,
        conversation_id=outcome.conversation_id,
        envelope=outcome.envelope,
    )


@router.post("/stream")
async def ask_streaming(
    payload: AskRequest,
    request: AuthedRequest,
    factory: Factory,
    embeddings: Embeddings,
    answers: Answers,
    reranker: Reranker,
) -> Response:
    """The same answer, with the wait made legible.

    Errors are emitted as an `error` event rather than raised, because by the
    time anything can fail here the response has already begun and its status
    line is long gone. A client that only handled HTTP status would see a
    perfectly successful empty stream.
    """
    request.require("documents:read")

    async def events() -> AsyncIterator[str]:
        sequence = 0

        def frame(name: str, data: object) -> str:
            nonlocal sequence
            sequence += 1
            return event(name, data, sequence=sequence)

        yield frame("turn.started", {"question": payload.question})

        try:
            outcome = await answer_question(
                factory,
                embeddings=embeddings,
                answers=answers,
                reranker=reranker,
                tenant_id=request.principal.tenant_id,
                user_id=request.principal.user_id,
                question=payload.question,
                conversation_id=payload.conversation_id,
                property_ids=payload.property_ids or None,
                idempotency_key=payload.idempotency_key,
            )
        except AnswerRefused as refused:
            yield frame("error", {"message": str(refused), "retryable": False})
            return
        except ProviderError:
            yield frame(
                "error",
                {
                    "message": "The model provider is unavailable. Try again in a moment.",
                    "retryable": True,
                },
            )
            return

        envelope = outcome.envelope

        # Layout before blocks, per §9.3: the client can allocate the shape of
        # the answer before it has the content to put in it.
        yield frame("layout", envelope.layout.model_dump(mode="json"))

        for block in envelope.blocks:
            yield frame("block.complete", block.model_dump(mode="json"))

        yield frame(
            "envelope.complete",
            {
                "turn_id": str(outcome.turn_id),
                "conversation_id": str(outcome.conversation_id),
                "envelope": envelope.model_dump(mode="json"),
            },
        )

    return stream(events())
