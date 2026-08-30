COMPOSE := docker compose
DEV_COMPOSE := $(COMPOSE) -f compose.yaml -f compose.dev.yaml

.DEFAULT_GOAL := help
.PHONY: help prod dev build dev-build down dev-down logs dev-logs ps dev-ps destroy dev-destroy

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