"""Asking a question.

`POST /v1/answers` runs the pipeline and returns the envelope. Not streamed
yet: `UPDATE.md` §9 asks for SSE and this returns the whole envelope at once.
That is a deliberate order rather than an omission — streaming changes how the
answer *arrives*, not what it is, and the envelope has to be right before it is
worth chunking. The route is shaped so streaming is added beside it without
changing the client's model of a turn.
"""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
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
