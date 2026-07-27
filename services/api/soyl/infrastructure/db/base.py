"""SQLAlchemy declarative base and shared column types."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, MetaData
from sqlalchemy.orm import DeclarativeBase, mapped_column

# Explicit naming so Alembic's autogenerate produces stable, reviewable names
# instead of whatever Postgres picked. A constraint whose name changes between
# environments cannot be dropped by a migration.
NAMING_CONVENTION = {
    "ix": "ix_%(table_name)s_%(column_0_N_name)s",
    "uq": "uq_%(table_name)s_%(column_0_N_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)


def timestamp_column(**kwargs: Any) -> Any:
    """timestamptz, always. A naive timestamp is a bug waiting for a timezone."""
    return mapped_column(DateTime(timezone=True), **kwargs)


__all__ = ["NAMING_CONVENTION", "Base", "datetime", "timestamp_column"]
