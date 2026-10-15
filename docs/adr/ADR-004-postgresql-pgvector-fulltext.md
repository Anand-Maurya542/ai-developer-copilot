# ADR-004: PostgreSQL with pgvector and Full-Text Search for Hybrid Retrieval

## Status
Accepted

## Date & Owner
- Date: 2026-10-15
- Owner: Data & Infrastructure Engineering

## Context and Constraints
Code search requires both:
1. **Lexical / Keyword precision**: matching exact function names, variables, imports, file paths (`findUserById`, `auth_guard.ts`).
2. **Semantic understanding**: answering intent-based conceptual questions ("Where is rate limiting implemented?", "How are payments refunded?").
Operating separate systems (e.g. Pinecone/Milvus + Elasticsearch + relational DB) introduces dual-write consistency issues, cross-system joins, synchronization latency, and operational sprawl for the initial release.

## Decision
1. Standardize on **PostgreSQL 16** as the unified transactional database, vector store, and lexical search engine:
   - `pgvector` extension for vector cosine/inner-product similarity search over code chunk embeddings.
   - Native PostgreSQL `tsvector` with GIN indexes (`search_tsv`) for keyword search.
2. Combine results using **Reciprocal Rank Fusion (RRF)**:
   $$RRF(d) = \sum_{m \in \{lex, vec\}} \frac{1}{k + r_m(d)}$$
   with $k=60$.
3. All queries enforce tenant and snapshot scoping directly inside SQL query WHERE clauses.

## Alternatives Considered
- *Pinecone / Qdrant + Elasticsearch*: High infrastructure complexity, separate billing, network roundtrips, and difficult multi-tenant transactional guarantees.
- *Vector-only Search*: Poor recall on exact identifiers and code symbols.

## Validation & Revisit Trigger
Revisit when code chunk count exceeds 50 million chunks per database cluster or when p95 hybrid query latency exceeds 500ms under expected concurrency.

