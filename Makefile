COMPOSE := docker compose
DEV_COMPOSE := $(COMPOSE) -f compose.yaml -f compose.dev.yaml

.DEFAULT_GOAL := help
.PHONY: help prod dev build dev-build down dev-down logs dev-logs ps dev-ps config test test-api test-client lint e2e migrate migration-current destroy dev-destroy

help:
	@echo "Trellis Docker commands:"
	@echo "  make prod       Start the production stack in the background"
	@echo "  make dev        Start the live-reload development stack"
	@echo "  make down       Stop the production stack"
	@echo "  make dev-down   Stop the development stack"
	@echo "  make logs       Follow production logs"
	@echo "  make dev-logs   Follow development logs"
	@echo "  make ps         Show production service status"
	@echo "  make dev-ps     Show development service status"
	@echo "  make build      Build production images"
	@echo "  make dev-build  Build development images"
	@echo "  make config     Validate the merged Compose configuration"
	@echo "  make test       Run backend and frontend unit suites"
	@echo "  make lint       Run the client lint gate"
	@echo "  make e2e        Run Playwright browser acceptance tests"
	@echo "  make migrate    Upgrade PostgreSQL to the latest schema"
	@echo "  make migration-current Show the current database revision"
	@echo "  make destroy    Remove production containers, networks, and volumes"
	@echo "  make dev-destroy Remove development containers, networks, and volumes"

prod:
	$(COMPOSE) up -d --build

dev:
	$(DEV_COMPOSE) up --build

build:
	$(COMPOSE) build

dev-build:
	$(DEV_COMPOSE) build

config:
	$(COMPOSE) config --quiet
	$(DEV_COMPOSE) config --quiet

test: test-api test-client

test-api:
	$(DEV_COMPOSE) run --rm -e PYTHONPATH=/app api python -m pytest -q

test-client:
	$(DEV_COMPOSE) run --rm client npm test -- --run

lint:
	$(DEV_COMPOSE) run --rm client npm run lint

e2e:
	cd client && npm run test:e2e

migrate:
	$(COMPOSE) run --rm api alembic upgrade head

migration-current:
	$(COMPOSE) run --rm api alembic current

down:
	$(COMPOSE) down

dev-down:
	$(DEV_COMPOSE) down

logs:
	$(COMPOSE) logs -f

dev-logs:
	$(DEV_COMPOSE) logs -f

ps:
	$(COMPOSE) ps

dev-ps:
	$(DEV_COMPOSE) ps

destroy:
	$(COMPOSE) down -v --remove-orphans

dev-destroy:
	$(DEV_COMPOSE) down -v --remove-orphans
