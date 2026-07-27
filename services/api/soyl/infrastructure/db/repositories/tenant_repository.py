"""Tenant reads.

``core.tenant``'s policy keys on ``id``, not ``tenant_id`` — the tenant is the
row. So a session scoped to tenant A can read exactly one tenant row: its own.
"""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from soyl.infrastructure.db.models.core import Tenant


class TenantRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get(self, tenant_id: uuid.UUID) -> Tenant | None:
        result = await self._session.execute(select(Tenant).where(Tenant.id == tenant_id))
        return result.scalar_one_or_none()

    async def list_visible(self) -> list[Tenant]:
        """Every tenant this session may see — which is one, or none."""
        result = await self._session.execute(select(Tenant).order_by(Tenant.name))
        return list(result.scalars().all())
