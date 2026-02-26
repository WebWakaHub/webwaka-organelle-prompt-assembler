/**
 * Prompt Assembler — Observability Interface
 * Organelle: ORGN-AI-PROMPT_ASSEMBLER-v0.1.0
 */

export interface IPromptAssemblerObservability {
  recordMetric(name: string, value: number, tags?: Record<string, string>): void;
  startSpan(operation: string): ObservabilitySpan;
  log(level: LogLevel, message: string, context?: Record<string, unknown>): void;
}

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

export interface ObservabilitySpan {
  spanId: string;
  operation: string;
  startTime: number;
  end(): void;
  addTag(key: string, value: string): void;
  setError(error: Error): void;
}

export class DefaultPromptAssemblerObservability implements IPromptAssemblerObservability {
  private metrics: Array<{ name: string; value: number; tags: Record<string, string>; timestamp: number }> = [];
  private spans: ObservabilitySpan[] = [];
  private logs: Array<{ level: LogLevel; message: string; context?: Record<string, unknown>; timestamp: number }> = [];

  recordMetric(name: string, value: number, tags: Record<string, string> = {}): void {
    this.metrics.push({ name, value, tags, timestamp: Date.now() });
  }

  startSpan(operation: string): ObservabilitySpan {
    const span: ObservabilitySpan = {
      spanId: `span_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      operation,
      startTime: Date.now(),
      end: () => {
        this.recordMetric(`${operation}.duration_ms`, Date.now() - span.startTime);
      },
      addTag: (key: string, value: string) => {
        this.recordMetric(`${operation}.tag`, 1, { [key]: value });
      },
      setError: (error: Error) => {
        this.log("ERROR", `Span ${operation} error: ${error.message}`);
      },
    };
    this.spans.push(span);
    return span;
  }

  log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    this.logs.push({ level, message, context, timestamp: Date.now() });
  }

  getMetrics(): ReadonlyArray<{ name: string; value: number; tags: Record<string, string>; timestamp: number }> {
    return [...this.metrics];
  }

  getLogs(): ReadonlyArray<{ level: LogLevel; message: string; context?: Record<string, unknown>; timestamp: number }> {
    return [...this.logs];
  }

  clear(): void {
    this.metrics.length = 0;
    this.spans.length = 0;
    this.logs.length = 0;
  }
}
