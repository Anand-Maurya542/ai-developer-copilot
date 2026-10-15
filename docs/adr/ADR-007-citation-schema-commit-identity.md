# ADR-007: Citation Schema and Commit Identity Contract

## Status
Accepted

## Date & Owner
- Date: 2026-10-15
- Owner: AI & DevEx Engineering

## Context and Constraints
Generic AI answers often sound plausible while referring to non-existent functions or wrong files. To build developer trust, answers must be strictly grounded in actual code, with verifiable line-level citations that resolve directly to the indexed snapshot rather than drifting to HEAD of a branch.

## Decision
1. **Citation Structure**:
   Every repository-specific claim in an AI answer must produce a typed citation:
   ```json
   {
     "citationId": "cit_123",
     "chunkId": "chunk_456",
     "commitSha": "7a3b4c...",
     "path": "src/payments/retry.ts",
     "startLine": 42,
     "endLine": 71,
     "validationStatus": "VALIDATED"
   }
   ```
2. **Server-Side Validation**:
   - Before streaming or saving a message, citations are validated against retrieved chunks:
     - Does `chunkId` exist in the retrieved set for this query?
     - Does `path` and `line_range` accurately match the chunk in the database?
   - Claims lacking evidence must either be marked with `confidence: low` or the system must emit "insufficient evidence in repository".
3. **Commit Identity Preservation**:
   - The UI links directly to GitHub permalinks with the explicit `commitSha` (`https://github.com/org/repo/blob/{commitSha}/{path}#L{startLine}-L{endLine}`).
   - Source inspection within the Copilot UI renders the exact code from the indexed snapshot.

