export type FindingSeverity = 'BLOCKING' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export type FindingDisposition = 'OPEN' | 'ACCEPTED' | 'DISMISSED' | 'RESOLVED';

export interface CodeLocation {
  path: string;
  startLine: number;
  endLine: number;
  commitSha: string;
}

export interface Finding {
  id: string;
  category: string;
  severity: FindingSeverity;
  confidence: number; // 0.0 - 1.0
  title: string;
  rationale: string;
  suggestedFix?: string;
  evidence: Array<{
    chunkId?: string;
    path: string;
    startLine: number;
    endLine: number;
    snippet?: string;
  }>;
  location: CodeLocation;
  disposition: FindingDisposition;
  publishedToGithub: boolean;
}

export interface PrAnalysisResult {
  analysisRunId: string;
  repositoryId: string;
  baseSha: string;
  headSha: string;
  summary: string;
  risksIdentified: string[];
  findings: Finding[];
}
