/**
 * PromptAssembler — Orchestrator (Main Entry Point)
 * Organelle: ORGN-AI-PROMPT_ASSEMBLER-v0.1.0
 */

import {
  PromptAssemblerConfig,
  PromptAssemblerState,
  PromptAssemblerCommand,
  PromptAssemblerResult,
  PromptAssemblerQuery,
  PromptAssemblerQueryResult,
  PromptAssemblerEvent,
  OperationMetrics,
  TelemetryData,
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

  constructor(
    config: PromptAssemblerConfig,
    storage?: IPromptAssemblerStorage,
    events?: IPromptAssemblerEvents,
    observability?: IPromptAssemblerObservability,
  ) {
    this.entity = new PromptAssemblerEntity(config);
    this.stateMachine = new PromptAssemblerStateMachine();
    this.storage = storage ?? new InMemoryPromptAssemblerStorage();
    this.events = events ?? new PromptAssemblerEventBus();
    this.observability = observability ?? new DefaultPromptAssemblerObservability(config.id);

    this.observability.log("INFO", `PromptAssembler orchestrator initialized`, { id: config.id });
  }

  async execute(command: PromptAssemblerCommand): Promise<PromptAssemblerResult> {
    const span = this.observability.createSpan("execute");
    this.observability.log("INFO", `Executing command: ${command.type}`, { correlationId: command.correlationId });

    try {
      const result = this.entity.execute(command);

      // Persist state
      await this.storage.save(this.entity.getId(), this.entity.toSnapshot());

      // Emit event
      this.events.emit({
        type: `PromptAssembler.${command.type}.${result.success ? "SUCCESS" : "FAILURE"}`,
        source: this.entity.getId(),
        data: { command: command.type, success: result.success },
        timestamp: Date.now(),
        correlationId: command.correlationId,
      });

      this.observability.recordMetric("command.duration", result.duration);
      return result;
    } finally {
      span.end();
    }
  }

  query(query: PromptAssemblerQuery): PromptAssemblerQueryResult {
    const span = this.observability.createSpan("query");
    try {
      return {
        data: {
          state: this.entity.getState(),
          metrics: this.entity.getMetrics(),
          snapshot: this.entity.toSnapshot(),
        },
        timestamp: Date.now(),
      };
    } finally {
      span.end();
    }
  }

  getState(): PromptAssemblerState {
    return this.entity.getState();
  }

  getMetrics(): OperationMetrics {
    return this.entity.getMetrics();
  }

  getTelemetry(): TelemetryData {
    return {
      organelleId: this.entity.getId(),
      state: this.entity.getState(),
      metrics: this.entity.getMetrics(),
      timestamp: Date.now(),
    };
  }

  async reset(): Promise<void> {
    this.observability.log("INFO", "Resetting organelle");
    this.stateMachine.reset();
  }

  async terminate(): Promise<void> {
    const span = this.observability.createSpan("terminate");
    try {
      this.observability.log("INFO", "PromptAssembler terminated");
    } finally {
      span.end();
    }
  }
}
