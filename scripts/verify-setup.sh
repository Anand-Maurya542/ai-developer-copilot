#!/usr/bin/env bash
set -euo pipefail

echo "========================================="
echo "AI Developer Copilot - Phase 0 Verification"
echo "========================================="

echo "[1/5] Checking configuration files..."
test -f package.json
test -f pnpm-workspace.yaml
test -f .env.example
test -f docker-compose.yml
test -f Makefile
test -f .gitignore
echo "✓ Root configuration files present."

echo "[2/5] Checking packages & apps structure..."
test -d apps/api/src
test -d apps/web/app
test -d packages/contracts/src
test -d packages/contracts/openapi
test -d packages/config/src
test -d packages/observability/src
test -d packages/database/migrations
test -d packages/database/seeds
test -d workers/ingestion/src
test -d workers/analysis/src
test -d workers/security/src
echo "✓ Directory structure matches technical blueprint."

echo "[3/5] Checking Architecture Decision Records..."
test -f docs/adr/ADR-000-template.md
test -f docs/adr/ADR-001-modular-monolith-and-workers.md
test -f docs/adr/ADR-002-github-app-permissions.md
test -f docs/adr/ADR-003-snapshot-oriented-indexing.md
test -f docs/adr/ADR-004-postgresql-pgvector-fulltext.md
test -f docs/adr/ADR-005-queue-semantics-idempotency.md
test -f docs/adr/ADR-006-ai-provider-abstraction.md
test -f docs/adr/ADR-007-citation-schema-commit-identity.md
echo "✓ Architecture Decision Records ADR-000 through ADR-007 present."

echo "[4/5] Running Python unit tests..."
python3 -m unittest discover -s workers/ingestion/tests
echo "✓ Ingestion worker unit tests passed."

echo "[5/5] Checking secret scanning rules..."
if grep -rE "ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{82}|sk-[a-zA-Z0-9]{20,}" . \
    --exclude=".env.example" --exclude="*.md" --exclude-dir=".git" > /dev/null 2>&1; then
  echo "❌ Secret leak detected!"
  exit 1
else
  echo "✓ No hardcoded secrets detected."
fi

echo "========================================="
echo "Phase 0 (Foundation) Verification: ALL PASSED"
echo "========================================="

