"""Create a lead.

Thin, because there is nothing clever to do yet — but it exists as a use case
rather than as code in the router because M6's admin panel and any future
import path will call the same thing (`docs/architecture/04-backend.md` §21.1).
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from soyl.infrastructure.db.repositories.lead_repository import LeadRepository


@dataclass(frozen=True, slots=True)
class CreateLeadCommand:
    name: str
    email: str
    company: str
    message: str
    source_url: str | None


@dataclass(frozen=True, slots=True)
class CreatedLead:
    id: UUID
    created_at: datetime


async def create_lead(session: AsyncSession, command: CreateLeadCommand) -> CreatedLead:
    lead = await LeadRepository(session).create(
        name=command.name,
        email=command.email,
        company=command.company,
        message=command.message,
        source_url=command.source_url,
    )
    return CreatedLead(id=lead.id, created_at=lead.created_at)
