-- AI Developer Copilot - Development Seed Data

INSERT INTO users (id, auth_subject, email, display_name)
VALUES ('00000000-0000-0000-0000-000000000001', 'github|10001', 'dev@example.com', 'Alex Developer')
ON CONFLICT (auth_subject) DO NOTHING;

INSERT INTO workspaces (id, name, slug, policy_json)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'Acme Engineering',
    'acme-engineering',
    '{"monthly_token_budget": 5000000, "allow_github_writes": false}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO memberships (workspace_id, user_id, role)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'OWNER'
)
ON CONFLICT (workspace_id, user_id) DO NOTHING;

INSERT INTO github_installations (id, workspace_id, installation_id, status, permissions_json)
VALUES (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002',
    12345678,
    'ACTIVE',
    '{"metadata": "read", "contents": "read", "pull_requests": "read"}'::jsonb
)
ON CONFLICT (installation_id) DO NOTHING;

INSERT INTO repositories (id, workspace_id, installation_id, github_repo_id, full_name, default_branch, status)
VALUES (
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    99887766,
    'acme/payment-service',
    'main',
    'CONNECTED'
)
ON CONFLICT (workspace_id, github_repo_id) DO NOTHING;

INSERT INTO repository_snapshots (id, repository_id, commit_sha, pipeline_version, status)
VALUES (
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000004',
    'e5b38d8f92c34a2e1d0f8a9b7c6d5e4f3a2b1c0d',
    'v1.0.0',
    'READY'
)
ON CONFLICT (repository_id, commit_sha, pipeline_version) DO NOTHING;

UPDATE repositories
SET active_snapshot_id = '00000000-0000-0000-0000-000000000005'
WHERE id = '00000000-0000-0000-0000-000000000004';
