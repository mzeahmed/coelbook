# ==============================================================================
# coelbook - Development Makefile
# ==============================================================================

ifneq (,$(wildcard ./.env))
    include .env
    export
endif

.DEFAULT_GOAL := help

COMPOSE := docker compose -f infra/docker-compose.yml --env-file .env

APP_CONTAINER := coelbook_backend

GREEN  := \033[0;32m
YELLOW := \033[1;33m
BLUE   := \033[0;34m
RED    := \033[0;31m
RESET  := \033[0m

.PHONY: help run build \
        fmt vet test check \
        tidy update \
        clean doctor \
        hosts-add hosts-remove up down restart logs ps bash \
        migrate-up migrate-down sqlc

help: ## Show available commands
	@echo ""
	@echo "$(BLUE)coelbook Development Commands$(RESET)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z0-9_-]+:.*##/ {printf "  \033[32m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""

# ==============================================================================
# Development
# ==============================================================================

run: ## Run the server
	cd backend && go run ./cmd/api

build: ## Build the local binary
	@mkdir -p backend/bin
	cd backend && go build -o bin/coelbook ./cmd
	@echo "$(GREEN)✓ Binary generated in backend/bin/coelbook$(RESET)"

# ==============================================================================
# Quality
# ==============================================================================

fmt: ## Format the source code
	cd backend && go fmt ./...

vet: ## Run go vet
	cd backend && go vet ./...

test: ## Run unit tests
	cd backend && go test ./...

check: fmt vet test ## Run all quality checks

# ==============================================================================
# Dependencies
# ==============================================================================

tidy: ## Clean up go.mod / go.sum
	cd backend && go mod tidy

update: ## Update dependencies
	cd backend && go get -u ./...
	cd backend && go mod tidy

# ==============================================================================
# Database
# ==============================================================================
migrate-create: ## Create migrations | make migrate-create t="table_name"
	@if [ $(t) ]; then \
  		echo "$(GREEN)Migrations building ... $(RESET)"; \
		goose -dir backend/internal/database/migrations -s create ${t} sql; \
		echo "$(GREEN)Migrations built $(RESET)"; \
	else \
		echo "$(RED)(t) param is required (make migrations t='table_name') $(RESET)"; \
	fi

migrate-up: ## Apply migrations
	@echo "$(GREEN)Database migrations up ... $(RESET)";
	goose -dir backend/internal/database/migrations postgres "user=$(DB_USER) password=$(DB_PASSWORD) host=$(DB_HOST) port=$(DB_PORT) dbname=$(DB_NAME) sslmode=disable" up
	@echo "$(GREEN)Database migrations finished! $(RESET)";

migrate-down: ## Roll back the last migration
	@echo "$(GREEN)Rollback last database migration ... $(RESET)";
	goose -dir backend/internal/database/migrations postgres "user=$(DB_USER) password=$(DB_PASSWORD) host=$(DB_HOST) port=$(DB_PORT) dbname=$(DB_NAME) sslmode=disable" down
	@echo "$(GREEN)Rollback done! $(RESET)";

sqlc: ## Regenerate Go code from SQL queries
	cd backend && sqlc generate

# ==============================================================================
# Docker
# ==============================================================================

hosts-add: ## Add local domains to /etc/hosts (requires sudo)
	@./infra/scripts/hosts-add.sh

hosts-remove: ## Remove local domains from /etc/hosts (requires sudo)
	@./infra/scripts/hosts-remove.sh

up: hosts-add ## Build and start the containers
	@if [ ! -f .env ]; then \
		echo "$(YELLOW).env not found, creating it from .env.example...$(RESET)"; \
		cp .env.example .env; \
	fi
	@echo "$(YELLOW)Starting containers...$(RESET)"
	$(COMPOSE) up -d --build
	@echo "$(GREEN)Containers started$(RESET)"
	@echo "$(BLUE)Backend URL: http://api.coelbook.local$(RESET)"
	@echo "$(BLUE)Frontend URL: http://coelbook.local$(RESET)"
	@echo "$(BLUE)Postgres: localhost:5432$(RESET)"
	@echo "$(BLUE)Adminer URL: http://localhost:8081$(RESET)"

down: hosts-remove ## Stop the containers
	@echo "$(YELLOW)Stopping containers...$(RESET)"
	$(COMPOSE) down
	@echo "$(GREEN)Containers stopped$(RESET)"

restart: down up ## Restart the containers

logs: ## Show container logs
	@echo "$(YELLOW)Showing logs...$(RESET)"
	$(COMPOSE) logs -f

ps: ## List containers
	@echo "$(YELLOW)Listing containers...$(RESET)"
	$(COMPOSE) ps

bash: ## Access the app container
	@echo "$(YELLOW)Accessing the app container...$(RESET)"
	docker exec -it $(APP_CONTAINER) sh

# ==============================================================================
# Utilities
# ==============================================================================

clean: ## Remove generated files
	rm -rf backend/bin

doctor: ## Show the development environment
	@echo ""
	@echo "$(BLUE)Environment$(RESET)"
	@echo ""
	@go version
	@git --version
