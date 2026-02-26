/**
 * Prompt Assembler — Entity Model
 * Organelle: ORGN-AI-PROMPT_ASSEMBLER-v0.1.0
 */

import {
  PromptAssemblerConfig,
  PromptAssemblerState,
  PromptAssemblerRequest,
  PromptAssemblerResult,
  PromptAssemblerError,
  AuditEntry,
  OperationMetrics,
  CognitiveContext,
} from "./types";

export class PromptAssemblerEntity {
  private readonly id: string;
  private readonly config: PromptAssemblerConfig;
  private state: PromptAssemblerState;
  private readonly createdAt: number;
  private updatedAt: number;
  private processedCount: number;
  private errorCount: number;
  private readonly auditLog: AuditEntry[];

  constructor(config: PromptAssemblerConfig) {
    this.id = config.id;
    this.config = Object.freeze({ ...config });
    this.state = PromptAssemblerState.IDLE;
    this.createdAt = Date.now();
    this.updatedAt = this.createdAt;
    this.processedCount = 0;
    this.errorCount = 0;
    this.auditLog = [];
  }

  getId(): string {
    return this.id;
  }

  getState(): PromptAssemblerState {
    return this.state;
  }

  getConfig(): Readonly<PromptAssemblerConfig> {
    return this.config;
  }

  getProcessedCount(): number {
    return this.processedCount;
  }

  getErrorCount(): number {
    return this.errorCount;
  }

  setState(newState: PromptAssemblerState): void {
    this.state = newState;
    this.updatedAt = Date.now();
  }

  incrementProcessed(): void {
    this.processedCount++;
    this.updatedAt = Date.now();
  }

  incrementErrors(): void {
    this.errorCount++;
    this.updatedAt = Date.now();
  }

  addAuditEntry(entry: AuditEntry): void {
    this.auditLog.push(entry);
  }

  getAuditLog(): ReadonlyArray<AuditEntry> {
    return [...this.auditLog];
  }

  validate(): boolean {
    if (!this.id || this.id.trim().length === 0) return false;
    if (!this.config.name || this.config.name.trim().length === 0) return false;
    if (this.config.maxConcurrency < 1) return false;
    if (this.config.timeoutMs < 100) return false;
    return true;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      state: this.state,
      config: this.config,
      processedCount: this.processedCount,
      errorCount: this.errorCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      auditLogSize: this.auditLog.length,
    };
  }
}
