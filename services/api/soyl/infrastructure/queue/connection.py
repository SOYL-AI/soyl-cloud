"""How to reach the queue — and nothing about what runs on it.

This exists to keep the API process out of the worker's import graph. The
upload route needs one thing from the queue, a Redis DSN, but importing it from
`worker` dragged in the whole job module: the ingestion pipeline, the provider
factory, and through it the OpenAI SDK — into the process that serves HTTP,
where none of it is ever called.

`import-linter` caught it as a §6.9 violation (`soyl.interface` reaching
`openai` along a four-hop chain), which is the contract doing exactly its job:
the direct import was innocent, and the transitive consequence was not. The
cost is real rather than stylistic — a web dyno paying the SDK's import time
and memory at every cold start for code it will never execute.
"""

from __future__ import annotations

from arq.connections import RedisSettings

from soyl.settings import get_settings


def redis_settings() -> RedisSettings:
    """ARQ's connection config, from the one place the DSN is configured."""
    return RedisSettings.from_dsn(str(get_settings().redis_url))
