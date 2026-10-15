# ADR-001: Modular NestJS API with Independent Python Workers

## Status
Accepted

## Date & Owner
- Date: 2026-10-15
- Owner: Backend & Platform Engineering

## Context and Constraints
The platform needs to serve low-latency REST and SSE endpoints for developer chat and GitHub webhooks, while executing compute-heavy, language-parsing, embedding, and diff analysis tasks asynchronously. Microservices introduce premature operational overhead, network latency, and deployment complexity.

## Decision
Adopt a **Modular Monolith in NestJS (TypeScript)** for the BFF / API, coupled via **Redis / BullMQ** to **independently scalable Python workers**:
1. **API**: NestJS modular application encapsulating auth, workspaces, repositories, chat, search, webhooks, audit, and usage.
2. **Workers**: Python processes for ingestion (`workers/ingestion`), PR diff analysis (`workers/analysis`), and security normalization (`workers/security`).
3. Services communicate asynchronously via structured, versioned queue jobs and a shared PostgreSQL database.

## Alternatives Considered
- *Pure Python Monolith (FastAPI/Django)*: Weaker support for modular TypeScript BFF with Next.js type-sharing, enterprise dependency injection, and SSE client contracts.
- *Full Microservices (10+ independent repos/deployments)*: Heavy DevOps tax, distributed transaction friction, and premature scaling costs before product-market validation.
- *Pure Node.js Workers*: Inferior AST parsing ecosystem (Tree-sitter bindings, Pygments) and data science / AI evaluation libraries compared to Python.

## Security and Privacy Impact
- API acts as the strict tenant authorization boundary.
- Python workers run with restricted privileges and do not have administrative access to public internet endpoints or the browser.

## Cost, Latency, and Reliability Impact
- Independent scaling: API instances scale on HTTP request rate / SSE connection count; Python workers scale on queue depth and CPU/GPU availability.
- Prevents worker starvation from impacting API response times.

## Consequences and Rollback Plan
- Clean boundaries between modules enforced via TypeScript module imports.
- Individual worker modules or API modules can be split into separate microservices later if scaling boundaries dictate.

