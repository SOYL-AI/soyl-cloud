"""Membership reads.

Same rule as `PropertyRepository`: no ``tenant_id`` filter in any query. The
policy is the filter.
"""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from soyl.infrastructure.db.models.core import Membership, MembershipProperty


class MembershipRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self,
        *,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
        role: str = "owner",
        property_scope: str = "all",
    ) -> Membership:
        membership = Membership(
            tenant_id=tenant_id, user_id=user_id, role=role, property_scope=property_scope
        )
        self._session.add(membership)
        await self._session.flush()
        return membership

    async def list_for_tenant(self) -> list[Membership]:
        result = await self._session.execute(select(Membership).order_by(Membership.created_at))
        return list(result.scalars().all())

    async def get(self, membership_id: uuid.UUID) -> Membership | None:
        result = await self._session.execute(
            select(Membership).where(Membership.id == membership_id)
        )
        return result.scalar_one_or_none()

    async def grant_property(
        self, *, membership_id: uuid.UUID, property_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> MembershipProperty:
        link = MembershipProperty(
            membership_id=membership_id, property_id=property_id, tenant_id=tenant_id
        )
        self._session.add(link)
        await self._session.flush()
        return link

    async def list_scoped_properties(self) -> list[MembershipProperty]:
        result = await self._session.execute(select(MembershipProperty))
        return list(result.scalars().all())
