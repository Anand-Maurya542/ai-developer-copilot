export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  service?: string;
  env?: string;
  correlationId?: string;
  workspaceId?: string;
  repositoryId?: string;
  snapshotId?: string;
  jobId?: string;
  errorCode?: string;
  [key: string]: unknown;
}

const SECRET_PATTERNS = [
  /bearer\s+[a-zA-Z0-9_\-\.]+/gi,
  /ghp_[a-zA-Z0-9]{36}/g,
  /github_pat_[a-zA-Z0-9_]{82}/g,
  /sk-[a-zA-Z0-9]{20,}/g,
  /-----BEGIN RSA PRIVATE KEY-----[\s\S]*?-----END RSA PRIVATE KEY-----/g,
  /-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/g,
];

export function redactSecrets(text: string): string {
  let redacted = text;
  for (const pattern of SECRET_PATTERNS) {
    redacted = redacted.replace(pattern, '[REDACTED_SECRET]');
  }
  return redacted;
}

export class Logger {
  private service: string;
  private env: string;

  constructor(service: string = 'copilot-api', env: string = process.env.NODE_ENV || 'development') {
    this.service = service;
    this.env = env;
  }

  private output(level: LogLevel, message: string, context?: LogContext, err?: Error): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      service: context?.service || this.service,
      env: this.env,
      message: redactSecrets(message),
      correlationId: context?.correlationId,
      workspaceId: context?.workspaceId,
      repositoryId: context?.repositoryId,
      jobId: context?.jobId,
      errorCode: context?.errorCode,
      stack: err?.stack,
      extra: context ? { ...context } : undefined,
    };

    // Clean undefined fields
    Object.keys(entry).forEach((k) => (entry as Record<string, unknown>)[k] === undefined && delete (entry as Record<string, unknown>)[k]);

    const serialized = JSON.stringify(entry);
    if (level === 'error') {
      console.error(serialized);
    } else if (level === 'warn') {
      console.warn(serialized);
    } else {
      console.log(serialized);
    }
  }

  debug(message: string, context?: LogContext): void {
    this.output('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.output('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.output('warn', message, context);
  }

  error(message: string, err?: Error, context?: LogContext): void {
    this.output('error', message, context, err);
  }
}

export const logger = new Logger();

