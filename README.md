# AI-Powered Developer Copilot

> Enterprise-minded repository intelligence, evidence-grounded code Q&A, AI-assisted reviews, and secure developer workflows.

Based on **Product Requirements Document (PRD v1.0)** and **Technical Design & Implementation Blueprint (v1.0)**.

---

## 1. System Architecture

```
                    ┌─────────────────────────┐
                    │   Developer Web (Next.js)│
                    └────────────┬────────────┘
                                 │ HTTPS / SSE
                    ┌────────────▼────────────┐
                    │    NestJS Modular API   │
                    └──────┬───────────┬──────┘
                           │           │
       ┌───────────────────┘           └──────────────────┐
       │ PostgreSQL (pgvector + FTS)                      │ Redis (BullMQ)
       │                                                  │
┌──────▼──────────────────────────────────────────────────▼──────┐
│                      Python Async Workers                       │
│  - Ingestion: tree-sitter chunking, embeddings, atomic publish  │
│  - Analysis: PR diff review, issue planning, evidence validation│
│  - Security: scanner provenance & deterministic normalization   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │ AI Gateway Adapters │
                    └─────────────────────┘
```

---

## 2. Monorepo Structure

```
├── apps/
│   ├── api/             # NestJS Modular API (Auth, Workspaces, Repos, Search, Chat, Webhooks)
│   └── web/             # Next.js UI (Streaming chat, citation viewer, admin dashboard)
├── workers/
│   ├── ingestion/       # AST parsing, chunking, embeddings, atomic publication
│   ├── analysis/        # PR summaries, diff review, issue-to-plan
│   └── security/        # Deterministic scanner adapters and provenance
├── packages/
│   ├── config/          # Validated runtime configuration & schemas
│   ├── contracts/       # OpenAPI spec, event schemas, DTOs
│   ├── database/        # PostgreSQL migrations (pgvector, FTS) & seeds
│   └── observability/   # Structured logging, correlation IDs, OpenTelemetry metrics
├── docs/
│   ├── adr/             # Architecture Decision Records (ADR-001 .. ADR-010)
│   ├── architecture/    # System design diagrams and specs
│   └── runbooks/        # Operations, disaster recovery, failure handling
└── infra/
    └── compose/         # Docker Compose definitions (Postgres 16 + pgvector, Redis, MinIO)
```

---

## 3. Quick Start & Prerequisites

### Prerequisites
- Node.js >= 20.x
- Python >= 3.10
- Docker & Docker Compose
- Git

### Initial Setup

```bash
# 1. Clone & initialize environment
cp .env.example .env

# 2. Start backing services (PostgreSQL + pgvector, Redis, MinIO)
make up

# 3. Setup python virtual environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r workers/ingestion/requirements.txt
pip install -r workers/analysis/requirements.txt

# 4. Install Node dependencies
npm install  # or pnpm install

# 5. Run Database Migrations & Seeds
npm run db:migrate
npm run db:seed

# 6. Run Development Servers
npm run dev
```

---

## 4. Key Invariants & Guarantees

- **Snapshot-Pinned Correctness**: Every chunk, vector, citation, and conversation is bound to an immutable commit SHA (`repository_snapshots`).
- **Strict Multi-Tenancy**: Data isolation is enforced at the Workspace root; no IDOR or cross-tenant exposure is permitted.
- **Evidence-Grounded**: Answers provide exact file paths and line ranges; the model admits "insufficient evidence" rather than hallucinating APIs or vulnerabilities.
- **Advisory Reviews**: AI findings are proposals with confidence and rationale. All GitHub write operations require server-side authorization and audit records.
