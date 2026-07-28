# Everything is a container, with no platform-specific build magic — one of the
# portability rules in docs/architecture/09-infrastructure-integrations.md §52.2
# that keeps the Railway → Azure move a deploy change rather than a rewrite.
#
# BUILD CONTEXT IS THE REPOSITORY ROOT, not services/api:
#
#     docker build -f services/api/Dockerfile .
#
# ADR-001 keeps the web app at the root, so Railway's build context is the repo
# and every COPY below is repo-relative. It also lets the image carry
# docker/postgres/*.sql, so bootstrap_roles.py can be run as a one-off against
# a managed database using exactly the SQL the local stack uses.

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
COPY services/api/pyproject.toml services/api/uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

COPY services/api/alembic.ini ./
COPY services/api/alembic ./alembic
COPY services/api/scripts ./scripts
COPY services/api/entrypoint.sh ./entrypoint.sh
COPY services/api/soyl ./soyl
COPY docker/postgres ./docker/postgres
RUN uv sync --frozen --no-dev

# Non-root. Railway does not require it; the next platform might, and an image
# that only runs as root is one that has to be rebuilt to find out.
RUN chmod +x /app/entrypoint.sh \
 && useradd --create-home --uid 10001 soyl \
 && chown -R soyl:soyl /app
USER soyl

EXPOSE 8000

# The role is chosen by SOYL_PROCESS: 'api' (default) or 'worker'. See
# entrypoint.sh for why dispatch lives there rather than in railway.json.
CMD ["/app/entrypoint.sh"]
