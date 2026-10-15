export type CitationValidationStatus = 'VALIDATED' | 'UNVALIDATED' | 'REJECTED';

export interface Citation {
  citationId: string;
  chunkId?: string | null;
  commitSha: string;
  path: string;
  startLine: number;
  endLine: number;
  validationStatus: CitationValidationStatus;
  snippet?: string;
}

export interface Claim {
  text: string;
  evidenceIds: string[];
  claimType: 'fact' | 'inference';
  confidence: 'high' | 'medium' | 'low';
}

export interface GroundedAnswer {
  answerText: string;
  claims: Claim[];
  citations: Citation[];
  followUpQuestion?: string | null;
  insufficientEvidence: boolean;
  modelId: string;
  promptVersion: string;
  retrievalVersion: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export type SseEventType =
  | 'answer.start'
  | 'answer.delta'
  | 'answer.citation'
  | 'answer.complete'
  | 'answer.error';

export interface SseStartData {
  requestId: string;
  snapshotSha: string;
}

export interface SseDeltaData {
  text: string;
}

export interface SseCitationData extends Citation {}

export interface SseCompleteData {
  messageId: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface SseErrorData {
  code: string;
  retryable: boolean;
  requestId: string;
}

