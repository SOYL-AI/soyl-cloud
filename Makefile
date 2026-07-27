# One command up, one command down. `make setup` is the path acceptance
# criterion 1 measures: git clone → running stack.
#
# Windows: run these from Git Bash. `make` is available through Git for Windows
# or `winget install GnuWin32.Make`; every recipe below is also a plain command
# you can copy out of this file if you would rather not install make.

.DEFAULT_GOAL := help
.PHONY: help setup up down reset migrate test test-web test-api lint check api web logs psql provider-check

API := services/api

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

setup: ## Everything a new machine needs: deps, stack, migrations, verification
	npm ci
	cd $(API) && uv sync
	@test -f $(API)/.env || cp $(API)/.env.example $(API)/.env
	@test -f $(API)/.env.migrations || cp $(API)/.env.migrations.example $(API)/.env.migrations
	docker compose up -d --wait
	cd $(API) && uv run alembic upgrade head
	@echo ""
	@echo "Stack is up. Verifying it actually works:"
	cd $(API) && uv run pytest tests/integration/test_tenant_isolation.py -q
	@echo ""
	@echo "  make api   → API on http://localhost:8000  (/health, /docs)"
	@echo "  make web   → site on http://localhost:3000"

up: ## Start Postgres, Redis and MinIO
	docker compose up -d --wait

down: ## Stop them, keeping the data
	docker compose down

reset: ## Stop them and destroy the data, then rebuild from scratch
	docker compose down -v
	docker compose up -d --wait
	cd $(API) && uv run alembic upgrade head

migrate: ## Apply migrations
	cd $(API) && uv run alembic upgrade head

api: ## Run the API with reload
	cd $(API) && uv run uvicorn soyl.main:create_app --factory --reload --port 8000

web: ## Run the marketing site
	npm run dev

test: test-web test-api ## Run everything

test-web: ## Node tests (needs a build first — they assert on prerendered HTML)
	npm run build
	npm test

test-api: ## Python tests, including the tenant isolation suite
	cd $(API) && uv run pytest -q

lint: ## Lint and typecheck both sides
	npm run typecheck
	npx eslint || true
	cd $(API) && uv run ruff check .
	cd $(API) && uv run mypy soyl
	cd $(API) && uv run lint-imports

check: test lint ## What CI runs

provider-check: ## Run the managed-Postgres check against a DSN: make provider-check DSN=postgresql://...
	cd $(API) && uv run python scripts/provider_check.py "$(DSN)"

logs: ## Tail the stack
	docker compose logs -f

psql: ## Open psql as the migrator
	docker compose exec postgres psql -U soyl_migrator -d soyl
