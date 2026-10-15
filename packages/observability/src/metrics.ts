export interface MetricRecord {
  name: string;
  value: number;
  tags: Record<string, string>;
  timestamp: string;
}

export class MetricsRegistry {
  private buffer: MetricRecord[] = [];

  increment(name: string, value: number = 1, tags: Record<string, string> = {}): void {
    this.buffer.push({
      name,
      value,
      tags,
      timestamp: new Date().toISOString(),
    });
  }

  timing(name: string, durationMs: number, tags: Record<string, string> = {}): void {
    this.buffer.push({
      name: `${name}.duration_ms`,
      value: durationMs,
      tags,
      timestamp: new Date().toISOString(),
    });
  }

  gauge(name: string, value: number, tags: Record<string, string> = {}): void {
    this.buffer.push({
      name,
      value,
      tags,
      timestamp: new Date().toISOString(),
    });
  }

  flush(): MetricRecord[] {
    const records = [...this.buffer];
    this.buffer = [];
    return records;
  }
}

export const metrics = new MetricsRegistry();
