.PHONY: help setup up down test lint typecheck clean db-migrate db-seed

help:
	@echo "AI-Powered Developer Copilot - Developer Commands"
	@echo "  make setup        - Initialize environment (.env, venv, deps)"
	@echo "  make up           - Start local services (postgres, redis, minio)"
	@echo "  make down         - Stop local services"
	@echo "  make test         - Run all test suites across packages & apps"
	@echo "  make lint         - Run linting checks across codebase"
	@echo "  make typecheck    - Run TypeScript typecheck"
	@echo "  make db-migrate   - Run PostgreSQL database migrations"
	@echo "  make db-seed      - Seed local database with initial test data"
	@echo "  make clean        - Clean build artifacts and temporary files"

setup:
	@if [ ! -f .env ]; then cp .env.example .env; echo "Created .env from .env.example"; fi
	@if [ ! -d .venv ]; then python3 -m venv .venv; echo "Created python .venv"; fi
	@echo "Setup complete. Start services with 'make up' and install dependencies."

up:
	docker compose up -d postgres redis minio

down:
	docker compose down

test:
	npm run test --if-present

lint:
	npm run lint --if-present

typecheck:
	npm run typecheck --if-present

clean:
	rm -rf dist build .next node_modules/.cache coverage
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

