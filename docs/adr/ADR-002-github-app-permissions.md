# ADR-002: GitHub App Integration and Least-Privilege Scopes

## Status
Accepted

## Date & Owner
- Date: 2026-10-15
- Owner: Security & Platform Engineering

## Context and Constraints
The platform interacts with customer private repositories to read code, process webhooks, and optionally draft pull-request reviews. Security requirements mandate minimal privilege, no long-lived user OAuth access tokens stored in plaintext, and tenant boundary enforcement.

## Decision
1. Connect repositories exclusively via a dedicated **GitHub App** installation rather than personal access tokens (PAT) or broad OAuth user tokens.
2. Request minimum required permissions:
   - Repository Metadata: Read-only
   - Contents: Read-only
   - Pull Requests: Read-only (default); Read-and-Write strictly gated behind explicit policy configuration and user intent.
   - Webhook events: `push`, `pull_request`, `installation`, `installation_repositories`.
3. Installation tokens are minted just-in-time using the App's RSA private key, cached with short TTL (< 60 minutes), and never exposed to the frontend browser or logs.

## Security and Privacy Impact
- Eliminates risk of compromised developer personal tokens exposing all personal repositories.
- Installations are bounded to explicit customer repositories selected in the GitHub UI.

## Consequences and Rollback Plan
- Disconnecting an installation immediately renders all derived API calls invalid and triggers data retention policies.

