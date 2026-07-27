# Everything is a container, with no platform-specific build magic — one of the
# portability rules in docs/architecture/09-infrastructure-integrations.md §52.2
# that keeps the Railway → Azure move a deploy change rather than a rewrite.

FROM python:3.12-slim-bookworm AS base

# uv, pinned. A build that silently changes its package manager version is a
# build that is not reproducible.
COPY --from=ghcr.io/astral-sh/uv:0.11.2 /uv /uvx /bin/

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/app/.venv \
    PATH="/app/.venv/bin:$PATH"

WORKDIR /app

# Dependencies in their own layer, so a code change does not reinstall the
# world. --frozen fails if uv.lock is out of date rather than quietly resolving
# something different from what CI tested.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

COPY alembic.ini ./
COPY alembic ./alembic
COPY scripts ./scripts
COPY soyl ./soyl
RUN uv sync --frozen --no-dev

# Non-root. Railway does not require it; the next platform might, and an image
# that only runs as root is one that has to be rebuilt to find out.
RUN useradd --create-home --uid 10001 soyl && chown -R soyl:soyl /app
USER soyl

EXPOSE 8000

# Railway injects PORT. Falls back to 8000 so `docker run` works unaided.
CMD ["sh", "-c", "uvicorn soyl.main:create_app --factory --host 0.0.0.0 --port ${PORT:-8000}"]
