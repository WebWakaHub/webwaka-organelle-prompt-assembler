/**
 * Prompt Assembler — Core Type Definitions
 * Organelle: ORGN-AI-PROMPT_ASSEMBLER-v0.1.0
 */

export enum PromptAssemblerState {
  IDLE = "IDLE",
  INITIALIZING = "INITIALIZING",
  READY = "READY",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  ERROR = "ERROR",
  TERMINATED = "TERMINATED",
}

export interface PromptAssemblerConfig {
  id: string;
  name: string;
  version: string;
  maxConcurrency: number;
  timeoutMs: number;
  retryPolicy: RetryPolicy;
  cognitiveContext?: CognitiveContext;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMs: number;
  backoffMultiplier: number;
}

export interface CognitiveContext {
  fabricId: string;
  tenantId: string;
  agentId: string;
  sessionId: string;
  correlationId: string;
  timestamp: number;
}

export interface PromptAssemblerRequest {
  requestId: string;
  payload: Record<string, unknown>;
  context: CognitiveContext;
  priority: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  timestamp: number;
}

export interface PromptAssemblerResult {
  requestId: string;
  success: boolean;
  data?: Record<string, unknown>;
  error?: PromptAssemblerError;
  metrics: OperationMetrics;
  auditTrail: AuditEntry[];
  timestamp: number;
}

export interface PromptAssemblerError {
  code: string;
  message: string;
  category: "VALIDATION" | "PROCESSING" | "TIMEOUT" | "INTERNAL";
  recoverable: boolean;
  details?: Record<string, unknown>;
}

export interface OperationMetrics {
  durationMs: number;
  memoryUsedBytes: number;
  stateTransitions: number;
  eventsEmitted: number;
}

export interface AuditEntry {
  entryId: string;
  organelleId: string;
  operation: string;
  agentId: string;
  timestamp: number;
  details: Record<string, unknown>;
}

export interface StateTransition {
  from: PromptAssemblerState;
  to: PromptAssemblerState;
  trigger: string;
  timestamp: number;
  guardResult: boolean;
}

export type StateChangeHandler = (transition: StateTransition) => void;
export type ErrorHandler = (error: PromptAssemblerError) => void;
export type MetricHandler = (metrics: OperationMetrics) => void;
