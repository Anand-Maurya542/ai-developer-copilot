# ADR-003: Snapshot-Oriented Indexing and Atomic Publication

## Status
Accepted

## Date & Owner
- Date: 2026-10-15
- Owner: AI & Retrieval Engineering

## Context and Constraints
Codebases change continuously across branches, commits, and force-pushes. In-place indexing or mutating an existing active index leads to race conditions, partial queries, and stale citation links that don't match the code viewed by developers.

## Decision
1. **Immutable Snapshots**: Every indexing run targets a pinned `commit_sha` and `pipeline_version`, creating a `repository_snapshots` row in `STAGING` state.
2. **Atomic Publication**:
   - Chunks and embeddings are created referencing the staging snapshot.
   - Once all files and embeddings pass validation checks, a database transaction flips `repository.active_snapshot_id = new_snapshot.id`, and updates `new_snapshot.status = 'READY'` while marking the previous snapshot `SUPERSEDED`.
3. **Fault Tolerance**: If indexing fails at any stage (network drop, embedding error, timeout), `staging_snapshot.status = 'FAILED'`, and the existing `active_snapshot_id` remains unaffected and active.
4. **Reproducible Citations**: Q&A queries bind strictly to a snapshot. Citations link directly to the exact commit SHA indexed.

## Consequences
- Zero downtime during re-indexing.
- No possibility of partial or broken indexes being queried by end users.

