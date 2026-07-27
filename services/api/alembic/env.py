"""Alembic environment.

Migrations connect as **soyl_migrator**, which is a different credential from
the one the application uses. That is the point of having two roles, so this
file reads its own setting rather than importing the application's `Settings`
— the API process should never be given the migration credential at all.

It is still typed and validated (`docs/architecture/10-security-devops.md`
§62.1); it is simply a separate, smaller configuration surface.
"""

# No `from __future__ import annotations` here on purpose: Alembic execs this
# file into a namespace of its own, so postponed annotations leave Pydantic
# unable to resolve `PostgresDsn` when it builds MigrationSettings.

import asyncio
from logging.config import fileConfig

from alembic import context
from pydantic import PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from soyl.infrastructure.db.models import Base


class MigrationSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="SOYL_", env_file=".env.migrations", extra="ignore", frozen=True
    )

    migration_database_url: PostgresDsn


config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def _url() -> str:
    return str(MigrationSettings().migration_database_url)  # type: ignore[call-arg]


def _include_object(obj, name, type_, reflected, compare_to):
    """Keep autogenerate away from things migrations do not own.

    Without this, autogenerate proposes dropping the extensions' tables and
    anything the provider installed into public.
    """
    if type_ == "table" and name in {"spatial_ref_sys"}:
        return False
    return True


def run_migrations_offline() -> None:
    context.configure(
        url=_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        include_schemas=True,
        include_object=_include_object,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        include_schemas=True,
        include_object=_include_object,
        # Catch a column whose type drifted, not just one that went missing.
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = _url()

    engine = async_engine_from_config(
        configuration, prefix="sqlalchemy.", poolclass=pool.NullPool
    )
    async with engine.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
