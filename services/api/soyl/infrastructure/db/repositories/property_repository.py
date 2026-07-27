"""Property reads and writes.

Note what is *not* here: no method takes a ``tenant_id`` argument and no query
has a ``WHERE tenant_id = ...`` clause. That is the point. The session carries
the tenant in ``app.tenant_id`` and Postgres applies it. A filter written here
too would be a second, weaker copy of the rule that could drift out of step
with the policy — and it would mask a missing policy in tests, which is the
one failure this design exists to make impossible.

The isolation suite proves it by calling every method below under the wrong
tenant and asserting zero rows.
"""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from soyl.infrastructure.db.models.core import Property


class PropertyRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self,
        *,
        tenant_id: uuid.UUID,
        name: str,
        rooms_total: int = 0,
        timezone: str = "Asia/Kolkata",
    ) -> Property:
        """``tenant_id`` is written, not filtered on.

        A row whose ``tenant_id`` disagrees with ``app.tenant_id`` is rejected
        by the policy's ``WITH CHECK``, so this cannot be used to write into
        another tenant.
        """
        prop = Property(
            tenant_id=tenant_id, name=name, rooms_total=rooms_total, timezone=timezone
        )
        self._session.add(prop)
        await self._session.flush()
        return prop

    async def get(self, property_id: uuid.UUID) -> Property | None:
        result = await self._session.execute(select(Property).where(Property.id == property_id))
        return result.scalar_one_or_none()

    async def list_active(self) -> list[Property]:
        result = await self._session.execute(
            select(Property).where(Property.deleted_at.is_(None)).order_by(Property.name)
        )
        return list(result.scalars().all())

    async def count(self) -> int:
        result = await self._session.execute(select(Property.id))
        return len(list(result.scalars().all()))
