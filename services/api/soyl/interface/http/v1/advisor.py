"""The public advisor.

`POST /v1/advisor` is the only route in this service that reaches a model
without an account behind it, which makes it the only one where someone else's
traffic can spend our money. It is rate limited in Redis by client key, and the
limit is low on purpose: a visitor answers five questions once.

The route deliberately returns no citations and carries no tenant. See
`soyl/domain/ai/advisor.py` for why that separation is load-bearing rather than
incidental.
"""

from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from pydantic import BaseModel, ConfigDict
from redis.asyncio import Redis

from soyl.domain.ai.advisor import QUESTIONS, AdvisorAnswers, AdvisorInsight
from soyl.domain.ai.ports import AdvisorProvider, ProviderError
from soyl.interface.http.deps import get_advisor, get_redis

logger = logging.getLogger("soyl.advisor")

router = APIRouter(prefix="/v1/advisor", tags=["advisor"])

Advisor = Annotated[AdvisorProvider, Depends(get_advisor)]
RedisDep = Annotated[Redis, Depends(get_redis)]

# A visitor answers the questions once. Ten leaves room for a retry and a
# curious second run; a hundred would be someone else's script.
RATE_LIMIT = 10
RATE_WINDOW_SECONDS = 3600


class AdviseRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    answers: AdvisorAnswers


class AdviseResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    insight: AdvisorInsight


@router.get("/questions")
async def questions() -> dict[str, object]:
    """What to ask, served rather than duplicated in the web app.

    The prompt is written against these exact questions, so a form that asked
    something slightly different would produce answers the prompt cannot
    interpret. One definition, in the domain.
    """
    return {"questions": QUESTIONS}


async def _within_limit(redis: Redis, key: str) -> bool:
    """Fixed window in Redis.

    Redis rather than process memory, because this service runs more than one
    container and an in-process limiter bounds abuse per instance — which is
    the same as not bounding it. The window is fixed rather than sliding: a
    burst at a boundary can reach twice the limit, and twenty advisor calls is
    not worth the extra round trips a sliding window costs.
    """
    bucket = f"advisor:{key}"
    count = await redis.incr(bucket)
    if count == 1:
        await redis.expire(bucket, RATE_WINDOW_SECONDS)
    return int(count) <= RATE_LIMIT


def _client_key(request: Request, forwarded: str | None) -> str:
    if forwarded:
        # First entry is the original client; the rest are proxies.
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.post("", response_model=AdviseResponse)
async def advise(
    payload: AdviseRequest,
    request: Request,
    advisor: Advisor,
    redis: RedisDep,
    x_forwarded_for: Annotated[str | None, Header()] = None,
) -> AdviseResponse:
    if not payload.answers.filled():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Answer at least one question.",
        )

    key = _client_key(request, x_forwarded_for)
    if not await _within_limit(redis, key):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="That is enough for now. Sign up to keep going.",
        )

    try:
        insight, usage = await advisor.advise(payload.answers)
    except ProviderError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The advisor is unavailable right now.",
        ) from error

    # Not written to `billing.usage_ledger`: that table is tenant-scoped under
    # RLS and this call has no tenant. Marketing spend is a different ledger
    # and a later problem; logging it keeps the number recoverable meanwhile.
    logger.info(
        "advisor answered tokens_in=%d tokens_out=%d",
        usage.input_tokens,
        usage.output_tokens,
    )

    return AdviseResponse(insight=insight)
