/**
 * PromptAssembler Entity — Unit Tests
 * Organelle: ORGN-AI-PROMPT_ASSEMBLER-v0.1.0
 */

import { PromptAssemblerEntity } from "../src/prompt-assembler-entity";
import { PromptAssemblerConfig, PromptAssemblerState, PromptAssemblerCommand } from "../src/types";

describe("PromptAssemblerEntity", () => {
  let entity: PromptAssemblerEntity;
  const config: PromptAssemblerConfig = {
    id: "test-prompt-assembler-001",
    name: "Test PromptAssembler",
    maxConcurrency: 5,
    timeoutMs: 30000,
    retryPolicy: { maxRetries: 3, backoffMs: 100, backoffMultiplier: 2 },
  };

  beforeEach(() => {
    entity = new PromptAssemblerEntity(config);
  });

  describe("initialization", () => {
    it("should initialize with IDLE state", () => {
      expect(entity.getState()).toBe(PromptAssemblerState.IDLE);
    });

    it("should have the correct ID", () => {
      expect(entity.getId()).toBe("test-prompt-assembler-001");
    });

    it("should have zero metrics initially", () => {
      const metrics = entity.getMetrics();
      expect(metrics.totalOperations).toBe(0);
      expect(metrics.successCount).toBe(0);
      expect(metrics.errorCount).toBe(0);
    });

    it("should have empty audit log initially", () => {
      expect(entity.getAuditLog()).toHaveLength(0);
    });
  });

  describe("state transitions", () => {
    it("should transition from IDLE to PROCESSING", () => {
      entity.setState(PromptAssemblerState.PROCESSING);
      expect(entity.getState()).toBe(PromptAssemblerState.PROCESSING);
    });

    it("should reject invalid transitions", () => {
      expect(() => entity.setState(PromptAssemblerState.COMPLETED)).toThrow("Invalid state transition");
    });

    it("should record audit entries on transitions", () => {
      entity.setState(PromptAssemblerState.PROCESSING);
      expect(entity.getAuditLog().length).toBeGreaterThan(0);
      expect(entity.getAuditLog()[0].action).toBe("STATE_TRANSITION");
    });

    it("should not allow transition from TERMINATED", () => {
      entity.setState(PromptAssemblerState.TERMINATED);
      expect(() => entity.setState(PromptAssemblerState.IDLE)).toThrow();
    });
  });

  describe("command execution", () => {
    it("should execute CREATE command successfully", () => {
      const command: PromptAssemblerCommand = {
        type: "CREATE",
        payload: { name: "test" },
        correlationId: "corr-001",
        timestamp: Date.now(),
      };
      const result = entity.execute(command);
      expect(result.success).toBe(true);
      expect(result.correlationId).toBe("corr-001");
    });

    it("should execute UPDATE command successfully", () => {
      const command: PromptAssemblerCommand = {
        type: "UPDATE",
        payload: { name: "updated" },
        correlationId: "corr-002",
        timestamp: Date.now(),
      };
      const result = entity.execute(command);
      expect(result.success).toBe(true);
    });

    it("should handle unknown command types gracefully", () => {
      const command: PromptAssemblerCommand = {
        type: "UNKNOWN_CMD",
        payload: {},
        correlationId: "corr-003",
        timestamp: Date.now(),
      };
      const result = entity.execute(command);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe("EXECUTION_FAILED");
    });

    it("should increment metrics on execution", () => {
      const command: PromptAssemblerCommand = {
        type: "CREATE",
        payload: {},
        correlationId: "corr-004",
        timestamp: Date.now(),
      };
      entity.execute(command);
      const metrics = entity.getMetrics();
      expect(metrics.totalOperations).toBe(1);
      expect(metrics.successCount).toBe(1);
    });

    it("should return to IDLE state after execution", () => {
      const command: PromptAssemblerCommand = {
        type: "CREATE",
        payload: {},
        correlationId: "corr-005",
        timestamp: Date.now(),
      };
      entity.execute(command);
      expect(entity.getState()).toBe(PromptAssemblerState.IDLE);
    });
  });

  describe("snapshot", () => {
    it("should produce a valid snapshot", () => {
      const snapshot = entity.toSnapshot();
      expect(snapshot.id).toBe("test-prompt-assembler-001");
      expect(snapshot.state).toBe(PromptAssemblerState.IDLE);
      expect(snapshot.operationCount).toBe(0);
    });
  });
});
