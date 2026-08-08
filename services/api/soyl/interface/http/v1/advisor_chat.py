"""The multi-turn conversational advisor endpoint.

This endpoint manages the conversation between a public visitor and the
AI advisor, ending with a personalised product recommendation.
"""

from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response, status
from pydantic import BaseModel, ConfigDict
from redis.asyncio import Redis

from soyl.domain.ai.conversational_advisor import ChatResponse, ChatTurn
from soyl.domain.ai.ports import ConversationalAdvisorProvider, ProviderError
from soyl.interface.http.deps import get_conversational_advisor, get_redis

logger = logging.getLogger("soyl.advisor_chat")

router = APIRouter(prefix="/v1/advisor/chat", tags=["advisor_chat"])

Advisor = Annotated[ConversationalAdvisorProvider, Depends(get_conversational_advisor)]
RedisDep = Annotated[Redis, Depends(get_redis)]

# Limit accommodates multi-turn
RATE_LIMIT = 30
RATE_WINDOW_SECONDS = 3600


class ChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    turn: ChatTurn


async def _within_limit(redis: Redis, key: str) -> bool:
    bucket = f"advisor_chat:{key}"
    count = await redis.incr(bucket)
    if count == 1:
        await redis.expire(bucket, RATE_WINDOW_SECONDS)
    return int(count) <= RATE_LIMIT


def _client_key(request: Request, forwarded: str | None) -> str:
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.post("", response_model=ChatResponse)
async def chat(
    payload: ChatRequest,
    request: Request,
    response_obj: Response,
    advisor: Advisor,
    redis: RedisDep,
    x_forwarded_for: Annotated[str | None, Header()] = None,
) -> ChatResponse:
    if not payload.turn.messages:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Message history cannot be empty.",
        )

    key = _client_key(request, x_forwarded_for)
    if not await _within_limit(redis, key):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="That is enough for now. Please wait before asking more.",
        )

    try:
        response, usage = await advisor.chat(payload.turn)
    except ProviderError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The advisor is unavailable right now.",
        ) from error

    logger.info(
        "advisor chat tokens_in=%d tokens_out=%d cost_inr=%.4f",
        usage.input_tokens,
        usage.output_tokens,
        usage.cost_inr,
    )

    response_obj.headers["Cache-Control"] = "no-store, no-transform"

    return response
