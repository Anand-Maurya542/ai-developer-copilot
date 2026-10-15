# ADR-005: Queue Delivery, Retries, Idempotency, and Dead-Letter Policy

## Status
Accepted

## Date & Owner
- Date: 2026-10-15
- Owner: Backend & Platform Engineering

## Context and Constraints
Asynchronous background jobs (ingestion, AST chunking, embeddings, PR diff processing) are subject to network timeouts, rate limiting from external providers (GitHub API, LLM providers), and process restarts. Queues must guarantee that duplicate events do not create duplicate work or inconsistent state.

## Decision
1. **Queue Infrastructure**: Use **Redis + BullMQ** for reliable distributed queue management with bounded concurrency per queue and per tenant.
2. **Idempotency Keys**:
   - Indexing: `repo_uuid:commit_sha:pipeline_v1`
   - Webhooks: `github_delivery_id:event_type`
   - PR Analysis: `repo_uuid:pr_number:head_sha:analysis_v1`
3. **Job Lifecycle States**:
   `QUEUED` -> `RUNNING` -> `VALIDATING` -> `SUCCEEDED` / `FAILED` / `DEAD_LETTER` / `RETRY_WAIT`.
4. **Retry & Backoff**:
   - Exponential backoff with jitter for transient errors (network, 429 rate limits, 503 provider outages).
   - Maximum 5 attempts before quarantine to `DEAD_LETTER` with safe, operator-visible error codes.
   - Non-retryable validation failures (e.g. malformed repository structure, unauthorized repo) fail immediately without retrying.

## Security and Privacy Impact
- Job payloads carry only IDs and metadata pointers; raw source code or credentials are never stored in queue messages.

