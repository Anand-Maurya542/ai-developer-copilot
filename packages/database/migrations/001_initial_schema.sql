-- AI Developer Copilot - Initial Schema Migration
-- Companion to PRD v1.0 & Technical Blueprint v1.0

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ==============================================================================
-- Custom ENUM types
-- ==============================================================================
DO $$ BEGIN
    CREATE TYPE snapshot_status AS ENUM ('STAGING', 'READY', 'FAILED', 'SUPERSEDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE membership_role AS ENUM ('OWNER', 'ADMIN', 'DEVELOPER', 'VIEWER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE job_status AS ENUM (
        'QUEUED', 'RUNNING', 'VALIDATING', 'RETRY_WAIT',
        'SUCCEEDED', 'FAILED', 'DEAD_LETTER', 'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE finding_severity AS ENUM ('BLOCKING', 'HIGH', 'MEDIUM', 'LOW', 'INFO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE citation_validation_status AS ENUM ('VALIDATED', 'UNVALIDATED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 1. Tenancy and Identity (IAM-01, IAM-02, IAM-03)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_subject TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    display_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    policy_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role membership_role NOT NULL DEFAULT 'DEVELOPER',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_membership_workspace_user UNIQUE (workspace_id, user_id)
);

-- ==============================================================================
-- 2. GitHub Integration (GH-01, GH-02, GH-03)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS github_installations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    installation_id BIGINT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    permissions_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS repositories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    installation_id UUID NOT NULL REFERENCES github_installations(id) ON DELETE CASCADE,
    github_repo_id BIGINT NOT NULL,
    full_name TEXT NOT NULL,
    default_branch TEXT NOT NULL DEFAULT 'main',
    active_snapshot_id UUID,
    status TEXT NOT NULL DEFAULT 'CONNECTED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_repo_workspace_github_id UNIQUE (workspace_id, github_repo_id)
);

-- ==============================================================================
-- 3. Snapshots, Files, and Chunks (ADR-003, ADR-004, ADR-007)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS repository_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    commit_sha TEXT NOT NULL,
    pipeline_version TEXT NOT NULL,
    status snapshot_status NOT NULL DEFAULT 'STAGING',
    manifest_uri TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_snapshot_commit_pipeline UNIQUE (repository_id, commit_sha, pipeline_version)
);

-- Defer adding foreign key for active_snapshot_id to repositories
DO $$ BEGIN
    ALTER TABLE repositories
    ADD CONSTRAINT fk_repositories_active_snapshot
    FOREIGN KEY (active_snapshot_id) REFERENCES repository_snapshots(id)
    ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS repository_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_id UUID NOT NULL REFERENCES repository_snapshots(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    blob_sha TEXT,
    content_hash TEXT NOT NULL,
    language TEXT,
    size_bytes INTEGER NOT NULL,
    parse_status TEXT NOT NULL DEFAULT 'PARSED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_snapshot_file_path UNIQUE (snapshot_id, path)
);

CREATE TABLE IF NOT EXISTS code_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_id UUID NOT NULL REFERENCES repository_snapshots(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES repository_files(id) ON DELETE CASCADE,
    symbol TEXT,
    start_line INTEGER NOT NULL,
    end_line INTEGER NOT NULL,
    content_hash TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),
    search_tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
    chunker_version TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_chunk_line_range CHECK (start_line >= 1 AND end_line >= start_line)
);

CREATE INDEX IF NOT EXISTS code_chunks_snapshot_idx ON code_chunks(snapshot_id);
CREATE INDEX IF NOT EXISTS code_chunks_tsv_idx ON code_chunks USING GIN(search_tsv);
CREATE INDEX IF NOT EXISTS code_chunks_file_idx ON code_chunks(file_id);

-- ==============================================================================
-- 4. Ingestion Jobs & State Machine (ADR-005, IDX-01..IDX-08)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS ingestion_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    snapshot_id UUID REFERENCES repository_snapshots(id) ON DELETE SET NULL,
    job_type TEXT NOT NULL DEFAULT 'INDEX_REPOSITORY',
    status job_status NOT NULL DEFAULT 'QUEUED',
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    idempotency_key TEXT UNIQUE NOT NULL,
    error_code TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_workspace_repo ON ingestion_jobs(workspace_id, repository_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_status ON ingestion_jobs(status);

-- ==============================================================================
-- 5. Conversations, Messages, and Citations (RAG-01..RAG-08)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    snapshot_id UUID NOT NULL REFERENCES repository_snapshots(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Repository Q&A',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    model_id TEXT,
    prompt_version TEXT,
    usage_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS citations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    chunk_id UUID REFERENCES code_chunks(id) ON DELETE SET NULL,
    commit_sha TEXT NOT NULL,
    path TEXT NOT NULL,
    start_line INTEGER NOT NULL,
    end_line INTEGER NOT NULL,
    validation_status citation_validation_status NOT NULL DEFAULT 'UNVALIDATED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_citations_message_id ON citations(message_id);

-- ==============================================================================
-- 6. PR Analysis & Findings (PR-01..PR-05)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS analysis_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    kind TEXT NOT NULL DEFAULT 'PR_REVIEW',
    external_id TEXT NOT NULL, -- e.g. pull request number
    base_sha TEXT NOT NULL,
    head_sha TEXT NOT NULL,
    analysis_version TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    result_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_analysis_run_target UNIQUE (repository_id, external_id, head_sha, analysis_version)
);

CREATE TABLE IF NOT EXISTS findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_run_id UUID NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    severity finding_severity NOT NULL DEFAULT 'INFO',
    confidence REAL NOT NULL CHECK (confidence >= 0.0 AND confidence <= 1.0),
    title TEXT NOT NULL,
    rationale TEXT NOT NULL,
    suggested_fix TEXT,
    evidence_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    location_json JSONB NOT NULL,
    disposition TEXT NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 7. Audit & Usage (IAM-05, ADM-01..ADM-05)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    result TEXT NOT NULL,
    correlation_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_workspace_time ON audit_events(workspace_id, created_at DESC);

CREATE TABLE IF NOT EXISTS usage_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    feature TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    estimated_cost NUMERIC(10, 6) NOT NULL DEFAULT 0.0,
    latency_ms INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_records_workspace ON usage_records(workspace_id, created_at DESC);
