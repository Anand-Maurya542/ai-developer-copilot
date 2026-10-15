# ADR-006: AI Provider Abstraction, Budgets, and Data Governance

## Status
Accepted

## Date & Owner
- Date: 2026-10-15
- Owner: AI/ML & Security Engineering

## Context and Constraints
LLM providers change models, pricing, and terms frequently. Relying directly on provider-specific client libraries creates vendor lock-in. Furthermore, sending code to external LLMs requires strict data minimization, budget caps, and privacy guarantees against model training on customer code.

## Decision
1. **AI Gateway Adapter**:
   - Provide an abstract `AiGatewayAdapter` interface with unified contracts for text generation, structured JSON output, and embedding generation.
   - Initial provider adapters: OpenAI, Anthropic, Google Gemini, with runtime provider switching via configuration.
2. **Budgeting & Rate Limiting**:
   - Track token usage (`input_tokens`, `output_tokens`, `estimated_cost`, `latency_ms`) per workspace on every request.
   - Enforce per-workspace monthly spending budgets and per-minute request rate limits.
3. **Data Governance & Redaction**:
   - Pre-prompt sanitization: detect and redact known secrets, bearer tokens, AWS keys, and `.env` variables before sending prompt payloads to LLM providers.
   - Explicit system prompt instructions designating repository content as untrusted input.
   - Enterprise guarantee: zero data retention for training from upstream model agreements.

