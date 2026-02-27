/**
 * PromptAssembler — Entity (Domain Logic)
 * Organelle: ORGN-AI-PROMPT_ASSEMBLER-v0.1.0
 */

import {
  PromptAssemblerConfig,
  PromptAssemblerState,
  PromptAssemblerCommand,
  PromptAssemblerResult,
  PromptAssemblerError,
  AuditEntry,
  OperationMetrics,
} from "./types";

export class PromptAssemblerEntity {
  private readonly id: string;
  private readonly config: PromptAssemblerConfig;
  private state: PromptAssemblerState;
  private readonly createdAt: number;
  private updatedAt: number;
  private operationCount: number;
  private successCount: number;
  private errorCount: number;
  private totalDuration: number;
  private readonly auditLog: AuditEntry[];

  constructor(config: PromptAssemblerConfig) {
    this.id = config.id;
    this.config = Object.freeze({ ...config });
    this.state = PromptAssemblerState.IDLE;
    this.createdAt = Date.now();
    this.updatedAt = this.createdAt;
    this.operationCount = 0;
    this.successCount = 0;
    this.errorCount = 0;
    this.totalDuration = 0;
    this.auditLog = [];
  }

  getId(): string {
    return this.id;
  }

  getState(): PromptAssemblerState {
    return this.state;
  }

  setState(newState: PromptAssemblerState): void {
    const oldState = this.state;
    this.validateTransition(oldState, newState);
    this.state = newState;
    this.updatedAt = Date.now();
    this.auditLog.push({
      id: `audit-${this.auditLog.length + 1}`,
      timestamp: Date.now(),
      action: "STATE_TRANSITION",
      actor: this.id,
      before: oldState,
      after: newState,
      correlationId: `transition-${Date.now()}`,
    });
  }

  private validateTransition(from: PromptAssemblerState, to: PromptAssemblerState): void {
    const validTransitions: Record<string, string[]> = {
      [PromptAssemblerState.IDLE]: [PromptAssemblerState.PROCESSING, PromptAssemblerState.TERMINATED],
      [PromptAssemblerState.PROCESSING]: [PromptAssemblerState.COMPLETED, PromptAssemblerState.ERROR],
      [PromptAssemblerState.COMPLETED]: [PromptAssemblerState.IDLE],
      [PromptAssemblerState.ERROR]: [PromptAssemblerState.IDLE],
      [PromptAssemblerState.TERMINATED]: [],
    };

    const allowed = validTransitions[from] || [];
    if (!allowed.includes(to)) {
      throw new Error(`Invalid state transition: ${from} → ${to}`);
    }
  }

  execute(command: PromptAssemblerCommand): PromptAssemblerResult {
    if (this.state !== PromptAssemblerState.IDLE) {
      throw new Error(`Cannot execute in state: ${this.state}`);
    }

    const startTime = Date.now();
    this.setState(PromptAssemblerState.PROCESSING);
    this.operationCount++;

    try {
      // Domain-specific command processing
      const result = this.processCommand(command);
      this.setState(PromptAssemblerState.COMPLETED);
      this.successCount++;
      const duration = Date.now() - startTime;
      this.totalDuration += duration;
      this.setState(PromptAssemblerState.IDLE);

      return {
        success: true,
        data: result,
        duration,
        correlationId: command.correlationId,
      };
    } catch (error) {
      this.setState(PromptAssemblerState.ERROR);
      this.errorCount++;
      const duration = Date.now() - startTime;
      this.totalDuration += duration;

      const err: PromptAssemblerError = {
        code: "EXECUTION_FAILED",
        message: error instanceof Error ? error.message : String(error),
      };

      // Auto-recover to IDLE
      this.setState(PromptAssemblerState.IDLE);

      return {
        success: false,
        error: err,
        duration,
        correlationId: command.correlationId,
      };
    }
  }

  private processCommand(command: PromptAssemblerCommand): Record<string, unknown> {
    // Domain-specific logic for PromptAssembler
    switch (command.type) {
      case "CREATE":
        return { created: true, id: `${this.id}-${Date.now()}`, ...command.payload };
      case "UPDATE":
        return { updated: true, ...command.payload };
      case "DELETE":
        return { deleted: true, id: command.payload["id"] };
      case "QUERY":
        return { results: [], query: command.payload };
      default:
        throw new Error(`Unknown command type: ${command.type}`);
    }
  }

  getMetrics(): OperationMetrics {
    return {
      totalOperations: this.operationCount,
      successCount: this.successCount,
      errorCount: this.errorCount,
      averageDuration: this.operationCount > 0 ? this.totalDuration / this.operationCount : 0,
      lastOperationAt: this.updatedAt,
    };
  }

  getAuditLog(): ReadonlyArray<AuditEntry> {
    return [...this.auditLog];
  }

  toSnapshot(): Record<string, unknown> {
    return {
      id: this.id,
      state: this.state,
      config: this.config,
      operationCount: this.operationCount,
      successCount: this.successCount,
      errorCount: this.errorCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      auditLogSize: this.auditLog.length,
    };
  }
}
