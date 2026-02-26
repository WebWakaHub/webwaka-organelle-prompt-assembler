/**
 * Prompt Assembler — Main Orchestrator
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
} from "./types";
import { PromptAssemblerEntity } from "./prompt-assembler-entity";
import { PromptAssemblerStateMachine } from "./state-machine";
import { IPromptAssemblerStorage, InMemoryPromptAssemblerStorage } from "./storage-interface";
import { IPromptAssemblerEvents, PromptAssemblerEventBus } from "./event-interface";
import { IPromptAssemblerObservability, DefaultPromptAssemblerObservability } from "./observability-interface";

export class PromptAssemblerOrchestrator {
  private entity: PromptAssemblerEntity;
  private stateMachine: PromptAssemblerStateMachine;
  private storage: IPromptAssemblerStorage;
  private events: IPromptAssemblerEvents;
  private observability: IPromptAssemblerObservability;
  private activeTasks: number = 0;

  constructor(
    config: PromptAssemblerConfig,
    storage?: IPromptAssemblerStorage,
    events?: IPromptAssemblerEvents,
    observability?: IPromptAssemblerObservability
  ) {
    this.entity = new PromptAssemblerEntity(config);
    this.stateMachine = new PromptAssemblerStateMachine();
    this.storage = storage ?? new InMemoryPromptAssemblerStorage();
    this.events = events ?? new PromptAssemblerEventBus();
    this.observability = observability ?? new DefaultPromptAssemblerObservability();
  }

  async initialize(): Promise<void> {
    const span = this.observability.startSpan("initialize");
    try {
      if (!this.entity.validate()) {
        throw new Error("Entity validation failed");
      }

      const transition = this.stateMachine.transition("initialize");
      this.events.emitStateChange(transition);
      this.observability.log("INFO", "Initializing Prompt Assembler");

      await this.storage.saveConfig(this.entity.getConfig());

      const readyTransition = this.stateMachine.transition("initialized");
      this.entity.setState(PromptAssemblerState.READY);
      this.events.emitStateChange(readyTransition);
      this.observability.log("INFO", "Prompt Assembler initialized successfully");
    } catch (error) {
      this.handleError(error as Error, "initialize");
      throw error;
    } finally {
      span.end();
    }
  }

  async process(request: PromptAssemblerRequest): Promise<PromptAssemblerResult> {
    const span = this.observability.startSpan("process");
    const startTime = Date.now();

    try {
      if (this.activeTasks >= this.entity.getConfig().maxConcurrency) {
        throw new Error("Max concurrency reached");
      }

      this.activeTasks++;
      const transition = this.stateMachine.transition("process");
      this.entity.setState(PromptAssemblerState.PROCESSING);
      this.events.emitStateChange(transition);

      this.emitAuditEntry("process_start", request.context.agentId, {
        requestId: request.requestId,
        priority: request.priority,
      });

      // Core processing logic
      const resultData = await this.executeProcessing(request);

      const completeTransition = this.stateMachine.transition("complete");
      this.entity.setState(PromptAssemblerState.COMPLETED);
      this.events.emitStateChange(completeTransition);
      this.entity.incrementProcessed();

      const metrics: OperationMetrics = {
        durationMs: Date.now() - startTime,
        memoryUsedBytes: process.memoryUsage?.().heapUsed ?? 0,
        stateTransitions: 2,
        eventsEmitted: 1,
      };
      this.events.emitMetric(metrics);

      const result: PromptAssemblerResult = {
        requestId: request.requestId,
        success: true,
        data: resultData,
        metrics,
        auditTrail: this.entity.getAuditLog().slice(-10) as AuditEntry[],
        timestamp: Date.now(),
      };

      await this.storage.saveResult(result);

      // Reset to ready
      const resetTransition = this.stateMachine.transition("reset");
      this.entity.setState(PromptAssemblerState.READY);
      this.events.emitStateChange(resetTransition);

      return result;
    } catch (error) {
      return this.handleProcessError(request, error as Error, startTime);
    } finally {
      this.activeTasks--;
      span.end();
    }
  }

  private async executeProcessing(request: PromptAssemblerRequest): Promise<Record<string, unknown>> {
    // Simulate processing with timeout enforcement
    const config = this.entity.getConfig();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Processing timeout")), config.timeoutMs)
    );

    const processingPromise = (async () => {
      return {
        processed: true,
        organelleId: this.entity.getId(),
        requestId: request.requestId,
        processedAt: Date.now(),
      };
    })();

    return Promise.race([processingPromise, timeoutPromise]);
  }

  private handleProcessError(
    request: PromptAssemblerRequest,
    error: Error,
    startTime: number
  ): PromptAssemblerResult {
    this.entity.incrementErrors();
    const errorObj: PromptAssemblerError = {
      code: "PROCESSING_ERROR",
      message: error.message,
      category: "PROCESSING",
      recoverable: true,
    };
    this.events.emitError(errorObj);

    try {
      this.stateMachine.transition("processError");
      this.entity.setState(PromptAssemblerState.ERROR);
      this.stateMachine.transition("recover");
      this.entity.setState(PromptAssemblerState.READY);
    } catch {
      // State recovery failed
    }

    return {
      requestId: request.requestId,
      success: false,
      error: errorObj,
      metrics: {
        durationMs: Date.now() - startTime,
        memoryUsedBytes: 0,
        stateTransitions: 2,
        eventsEmitted: 1,
      },
      auditTrail: [],
      timestamp: Date.now(),
    };
  }

  private handleError(error: Error, operation: string): void {
    this.observability.log("ERROR", `${operation} failed: ${error.message}`);
    const errorObj: PromptAssemblerError = {
      code: `${operation.toUpperCase()}_ERROR`,
      message: error.message,
      category: "INTERNAL",
      recoverable: false,
    };
    this.events.emitError(errorObj);
  }

  private emitAuditEntry(
    operation: string,
    agentId: string,
    details: Record<string, unknown>
  ): void {
    const entry: AuditEntry = {
      entryId: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      organelleId: this.entity.getId(),
      operation,
      agentId,
      timestamp: Date.now(),
      details,
    };
    this.entity.addAuditEntry(entry);
    this.storage.saveAuditEntry(entry).catch(() => {});
  }

  getState(): PromptAssemblerState {
    return this.entity.getState();
  }

  getEntity(): Readonly<Record<string, unknown>> {
    return this.entity.toJSON();
  }

  async terminate(): Promise<void> {
    const span = this.observability.startSpan("terminate");
    try {
      this.stateMachine.transition("terminate");
      this.entity.setState(PromptAssemblerState.TERMINATED);
      this.observability.log("INFO", "Prompt Assembler terminated");
    } finally {
      span.end();
    }
  }
}
