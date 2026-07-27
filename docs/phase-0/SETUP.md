# Setting up from a clean clone

M1 acceptance criterion 1 is "clone to running stack in under 30 minutes". This
is the path that was measured, and the honest numbers.

## Prerequisites

These are **not** counted in the timings below, because installing them is a
one-time cost per machine rather than per clone. On a genuinely bare machine
they dominate everything else — Docker Desktop alone is around ten minutes
including the restart.

| Tool | Version used | Notes |
|---|---|---|
| Docker Desktop | 28.4.0 | Must be **running**, not just installed |
| Node | 22 | Pinned in CI; not pinned locally (see below) |
| Python | 3.12 | 3.12 or newer |
| `uv` | 0.11.2 | `winget install astral-sh.uv` / `brew install uv` |
| `make` | any | Optional — every recipe is a plain command you can copy |

## The path

```bash
git clone https://github.com/SOYL-AI/soyl-cloud.git
cd soyl-cloud
make setup
```

`make setup` installs both dependency trees, copies the two `.env` templates,
brings up Postgres, Redis and MinIO, applies migrations, and then **runs the
tenant isolation suite** — because "the stack is up" and "the stack works" are
different claims and only the second one is worth reporting.

Then:

```bash
make api   # http://localhost:8000 — /health, /docs
make web   # http://localhost:3000
```

## Measured, 2026-07-27

Windows 11, warm npm and uv caches, ~49 MB/s to Docker Hub.

| Step | Time |
|---|---|
| `git clone` | 4 s |
| `npm ci` | 5 s |
| `uv sync` | 15 s |
| `docker compose up --wait` (images cached) | ~15 s |
| Docker image pull, if cold (920 MB) | ~19 s |
| `alembic upgrade head` | 20 s |
| Tenant isolation suite | 11 s |
| **Total** | **≈ 90 seconds** |

**So `UPDATE.md` §12's 30 minutes is not the constraint — the toolchain is.**
With the prerequisites already installed this is a ninety-second setup. On a
machine with none of them, expect 20–30 minutes, essentially all of it Docker
Desktop. The number in the brief is comfortable either way, but it is measuring
the wrong thing: nobody is waiting on `make setup`, they are waiting on Docker.

## Ports

The stack deliberately does **not** use the default ports:

| Service | Host port | Why |
|---|---|---|
| Postgres | **5433** | A machine with Postgres installed owns 5432. On Windows the published port binds without error while connections still reach the *native* service — which presents as `password authentication failed for user soyl_migrator` and cost an hour to find. |
| Redis | **6380** | Same reasoning. |
| MinIO | 9000 / 9001 | Console on 9001. |

Override with `SOYL_POSTGRES_PORT`, `SOYL_REDIS_PORT`, `SOYL_MINIO_PORT`.

## The two env files, and why there are two

| File | Read by | Contains |
|---|---|---|
| `services/api/.env` | The API process | The **application** credential (`soyl_app`), Redis, the lead token |
| `services/api/.env.migrations` | Alembic, `provider_check.py` | The **migration** credential (`soyl_migrator`) and the instance admin |

The API's `Settings` uses `extra="forbid"`, so if the migration credential is
ever put back into `.env` the process refuses to start. That is the intended
behaviour: the API must never hold the credential that owns its tables.

## When the init scripts change

`docker/postgres/*.sql` runs **once**, against an empty data directory. Editing
those files does nothing until the volume is destroyed:

```bash
make reset   # docker compose down -v, up, migrate
```

This catches everyone once. It caught me during M1.

## Checking a managed Postgres provider

Before pointing staging at anything, run the check from
[POSTGRES-PROVIDER-CHECK.md](POSTGRES-PROVIDER-CHECK.md):

```bash
make provider-check DSN="postgresql://user:pw@host:5432/db"
```

Run it against the **pooled** connection string as well as the direct one. A
transaction-mode pooler can pass every criterion on the direct port and still
leak `app.tenant_id` between requests in production.
