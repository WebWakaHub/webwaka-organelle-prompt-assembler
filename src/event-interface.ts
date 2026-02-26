/**
 * Prompt Assembler — Event Interface
 * Organelle: ORGN-AI-PROMPT_ASSEMBLER-v0.1.0
 */

import {
  StateTransition,
  PromptAssemblerError,
  OperationMetrics,
  StateChangeHandler,
  ErrorHandler,
  MetricHandler,
} from "./types";

export interface IPromptAssemblerEvents {
  onStateChange(handler: StateChangeHandler): () => void;
  onError(handler: ErrorHandler): () => void;
  onMetric(handler: MetricHandler): () => void;
  emitStateChange(transition: StateTransition): void;
  emitError(error: PromptAssemblerError): void;
  emitMetric(metrics: OperationMetrics): void;
}

export class PromptAssemblerEventBus implements IPromptAssemblerEvents {
  private stateHandlers: Set<StateChangeHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private metricHandlers: Set<MetricHandler> = new Set();

  onStateChange(handler: StateChangeHandler): () => void {
    this.stateHandlers.add(handler);
    return () => this.stateHandlers.delete(handler);
  }

  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  onMetric(handler: MetricHandler): () => void {
    this.metricHandlers.add(handler);
    return () => this.metricHandlers.delete(handler);
  }

  emitStateChange(transition: StateTransition): void {
    for (const handler of this.stateHandlers) {
      try {
        handler(transition);
      } catch (err) {
        console.error("[PromptAssemblerEventBus] State handler error:", err);
      }
    }
  }

  emitError(error: PromptAssemblerError): void {
    for (const handler of this.errorHandlers) {
      try {
        handler(error);
      } catch (err) {
        console.error("[PromptAssemblerEventBus] Error handler error:", err);
      }
    }
  }

  emitMetric(metrics: OperationMetrics): void {
    for (const handler of this.metricHandlers) {
      try {
        handler(metrics);
      } catch (err) {
        console.error("[PromptAssemblerEventBus] Metric handler error:", err);
      }
    }
  }

  removeAllListeners(): void {
    this.stateHandlers.clear();
    this.errorHandlers.clear();
    this.metricHandlers.clear();
  }
}
