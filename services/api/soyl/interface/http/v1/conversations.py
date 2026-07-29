"""Conversation history.

Reading back what was asked and answered. `ai.turn` and `ai.envelope` have been
written since M4's first answer; this is the first thing that reads them.

Scoped to the tenant rather than the user, deliberately. A duty manager asks
something on the late shift and the general manager reads it the next morning —
per-user history would hide the answer from the person it was escalated to, and
in a hotel that escalation is the normal case rather than the exception.
"""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, ConfigDict

from soyl.infrastructure.db.repositories.answer_repository import AnswerRepository
from soyl.interface.http.authenticated import AuthedRequest

router = APIRouter(prefix="/v1/conversations", tags=["conversations"])


class ConversationSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    title: str | None
    turn_count: int
    last_turn_at: str | None
    created_at: str


class TurnRecord(BaseModel):
    model_config = ConfigDict(extra="forbid")

    turn_id: str
    question: str
    status: str
    asked_at: str
    # The stored envelope, verbatim. Not re-validated on read: it passed the
    # provenance validator before it was written, and re-running that here
    # against a corpus that may have changed since would strip a citation that
    # was correct when it was made — turning a document deletion into a
    # rewritten history.
    envelope: dict[str, Any] | None


@router.get("", response_model=list[ConversationSummary])
async def list_conversations(request: AuthedRequest) -> list[ConversationSummary]:
    request.require("documents:read")

    rows = await AnswerRepository(request.session).list_conversations()
    return [
        ConversationSummary(
            id=str(row.id),
            title=row.title,
            turn_count=row.turn_count,
            last_turn_at=row.last_turn_at.isoformat() if row.last_turn_at else None,
            created_at=row.created_at.isoformat(),
        )
        for row in rows
    ]


@router.get("/{conversation_id}", response_model=list[TurnRecord])
async def load_conversation(
    conversation_id: uuid.UUID, request: AuthedRequest
) -> list[TurnRecord]:
    request.require("documents:read")

    turns = await AnswerRepository(request.session).load_conversation(conversation_id)
    if not turns:
        # RLS makes another tenant's conversation indistinguishable from one
        # that does not exist, which is the correct answer to give either way:
        # confirming existence would leak that a row is there.
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No such conversation."
        )

    return [
        TurnRecord(
            turn_id=str(turn.turn_id),
            question=turn.question,
            status=turn.status,
            asked_at=turn.asked_at.isoformat(),
            envelope=turn.envelope,
        )
        for turn in turns
    ]
