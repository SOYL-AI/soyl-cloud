"""Writing to the usage ledger.

`UPDATE.md` §6.6. Like the audit log, this is INSERT-and-SELECT only by grant,
so there is no update or delete method here and one would be refused anyway.

Also like the audit log, a failed write must never fail the operation it was
recording — a document that embedded successfully must not be marked failed
because the ledger was briefly unreachable. The write runs in a SAVEPOINT for
the same reason: swallowing the exception without one leaves a poisoned
transaction whose commit silently discards the caller's work.
"""

from __future__ import annotations

import logging
import uuid
from decimal import Decimal

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("soyl.billing")


class UsageRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def record(
        self,
        *,
        tenant_id: uuid.UUID,
        kind: str,
        provider: str | None = None,
        model: str | None = None,
        route: str | None = None,
        user_id: uuid.UUID | None = None,
        turn_id: uuid.UUID | None = None,
        input_tokens: int = 0,
        output_tokens: int = 0,
        cached_tokens: int = 0,
        units: Decimal | int = 0,
        cost_inr: Decimal | int | float = 0,
    ) -> None:
        try:
            async with self._session.begin_nested():
                await self._session.execute(
                    text(
                        """
                        INSERT INTO billing.usage_ledger (
                            tenant_id, user_id, turn_id, kind, provider, model, route,
                            input_tokens, output_tokens, cached_tokens, units, cost_inr
                        ) VALUES (
                            :tenant_id, :user_id, :turn_id, :kind, :provider, :model, :route,
                            :input_tokens, :output_tokens, :cached_tokens, :units, :cost_inr
                        )
                        """
                    ),
                    {
                        "tenant_id": tenant_id,
                        "user_id": user_id,
                        "turn_id": turn_id,
                        "kind": kind,
                        "provider": provider,
                        "model": model,
                        "route": route,
                        "input_tokens": input_tokens,
                        "output_tokens": output_tokens,
                        "cached_tokens": cached_tokens,
                        "units": Decimal(str(units)),
                        "cost_inr": Decimal(str(cost_inr)),
                    },
                )
        except SQLAlchemyError:
            logger.exception(
                "usage ledger write failed tenant=%s kind=%s model=%s", tenant_id, kind, model
            )
