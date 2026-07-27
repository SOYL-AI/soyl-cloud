"""Lead capture.

The one write endpoint in M1, and the only one reachable before a user exists.
Guarded by a shared bearer token (`deps.require_lead_token`) until M2 replaces
it with the signed JWT exchange.
"""

from __future__ import annotations

from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from soyl.application.lead.create_lead import CreateLeadCommand, create_lead
from soyl.infrastructure.db.session import untenanted_session
from soyl.interface.http.deps import get_session_factory, require_lead_token

router = APIRouter(prefix="/v1", tags=["leads"])


class LeadCreate(BaseModel):
    """Mirrors `packages/contracts` ``LeadCreate``.

    ``extra="forbid"`` per `UPDATE.md` §13 — an unexpected field is a contract
    drift and should fail loudly rather than be dropped on the floor.
    """

    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    company: str = Field(min_length=1, max_length=160)
    message: str = Field(min_length=10, max_length=5000)
    source_url: str | None = Field(default=None, max_length=2048)


class LeadCreated(BaseModel):
    id: UUID
    created_at: datetime


@router.post(
    "/leads",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_lead_token)],
    response_model=LeadCreated,
)
async def post_lead(
    payload: LeadCreate,
    factory: Annotated[async_sessionmaker[AsyncSession], Depends(get_session_factory)],
) -> LeadCreated:
    async with untenanted_session(factory) as session:
        created = await create_lead(
            session,
            CreateLeadCommand(
                name=payload.name,
                email=str(payload.email),
                company=payload.company,
                message=payload.message,
                source_url=payload.source_url,
            ),
        )

    return LeadCreated(id=created.id, created_at=created.created_at)
