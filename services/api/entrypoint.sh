#!/bin/sh
# One image, two roles, chosen by configuration.
#
# Railway reads railway.json from the build context root, which ADR-001 makes
# the repository root — so a startCommand in services/api/ is silently ignored
# and the API and the worker would otherwise need separate images. Dispatching
# here keeps them a single build, which also matters for the Azure Container
# Apps move (09-infrastructure-integrations.md §52.2): the same image, three
# services, different SOYL_PROCESS.
set -e

case "${SOYL_PROCESS:-api}" in
  api)
    # Migrations immediately before the server, in the same release. A
    # container that starts against an unmigrated database serves 500s that
    # look like application bugs.
    alembic upgrade head
    exec uvicorn soyl.main:create_app --factory --host 0.0.0.0 --port "${PORT:-8000}"
    ;;
  worker)
    # Deliberately does NOT migrate. Two processes racing the same migration on
    # a simultaneous deploy is how a schema ends up half-applied; the API owns
    # that step.
    exec arq soyl.infrastructure.queue.worker.WorkerSettings
    ;;
  *)
    echo "Unknown SOYL_PROCESS: ${SOYL_PROCESS}. Expected 'api' or 'worker'." >&2
    exit 1
    ;;
esac
