"""Lead writes.

The only repository that runs on an untenanted session, because `public.lead`
is the only table with no tenant. See `soyl/infrastructure/db/models/lead.py`.
"""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from soyl.infrastructure.db.models.lead import Lead


class LeadRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self,
        *,
        name: str,
        email: str,
        company: str,
        message: str,
        source_url: str | None,
    ) -> Lead:
        lead = Lead(
            name=name, email=email, company=company, message=message, source_url=source_url
        )
        self._session.add(lead)
        await self._session.flush()
        return lead
