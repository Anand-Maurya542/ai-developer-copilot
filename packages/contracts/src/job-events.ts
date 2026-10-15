export type JobState =
  | 'QUEUED'
  | 'RUNNING'
  | 'VALIDATING'
  | 'RETRY_WAIT'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'DEAD_LETTER'
  | 'CANCELLED';

export type JobType = 'INDEX_REPOSITORY' | 'PR_ANALYSIS' | 'ISSUE_PLAN' | 'SECURITY_SCAN';

export interface RepositoryIndexEventPayload {
  commitSha: string;
  pipelineVersion: string;
  reason: 'manual_reindex' | 'webhook_push' | 'initial_connect';
}

export interface RepositoryIndexRequestedEvent {
  schemaVersion: 1;
  eventId: string;
  eventType: 'repository.index.requested';
  occurredAt: string;
  workspaceId: string;
  repositoryId: string;
  snapshotId: string;
  requestedBy: string;
  idempotencyKey: string;
  traceId: string;
  payload: RepositoryIndexEventPayload;
}

export interface JobStatusResponse {
  id: string;
  jobType: JobType;
  status: JobState;
  attempts: number;
  maxAttempts: number;
  errorCode?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

