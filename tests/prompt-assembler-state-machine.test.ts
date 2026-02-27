/**
 * PromptAssembler State Machine — Unit Tests
 * Organelle: ORGN-AI-PROMPT_ASSEMBLER-v0.1.0
 */

import { PromptAssemblerStateMachine } from "../src/state-machine";
import { PromptAssemblerState } from "../src/types";

describe("PromptAssemblerStateMachine", () => {
  let sm: PromptAssemblerStateMachine;

  beforeEach(() => {
    sm = new PromptAssemblerStateMachine();
  });

  it("should start in IDLE state", () => {
    expect(sm.getState()).toBe(PromptAssemblerState.IDLE);
  });

  it("should allow IDLE → PROCESSING", () => {
    expect(sm.canTransition(PromptAssemblerState.PROCESSING)).toBe(true);
    sm.transition(PromptAssemblerState.PROCESSING);
    expect(sm.getState()).toBe(PromptAssemblerState.PROCESSING);
  });

  it("should allow PROCESSING → COMPLETED", () => {
    sm.transition(PromptAssemblerState.PROCESSING);
    sm.transition(PromptAssemblerState.COMPLETED);
    expect(sm.getState()).toBe(PromptAssemblerState.COMPLETED);
  });

  it("should allow PROCESSING → ERROR", () => {
    sm.transition(PromptAssemblerState.PROCESSING);
    sm.transition(PromptAssemblerState.ERROR);
    expect(sm.getState()).toBe(PromptAssemblerState.ERROR);
  });

  it("should allow ERROR → IDLE via reset", () => {
    sm.transition(PromptAssemblerState.PROCESSING);
    sm.transition(PromptAssemblerState.ERROR);
    sm.reset();
    expect(sm.getState()).toBe(PromptAssemblerState.IDLE);
  });

  it("should reject invalid transitions", () => {
    expect(() => sm.transition(PromptAssemblerState.COMPLETED)).toThrow();
  });

  it("should maintain transition history", () => {
    sm.transition(PromptAssemblerState.PROCESSING);
    sm.transition(PromptAssemblerState.COMPLETED);
    const history = sm.getHistory();
    expect(history).toHaveLength(2);
    expect(history[0].from).toBe(PromptAssemblerState.IDLE);
    expect(history[0].to).toBe(PromptAssemblerState.PROCESSING);
  });

  it("should allow IDLE → TERMINATED", () => {
    sm.transition(PromptAssemblerState.TERMINATED);
    expect(sm.getState()).toBe(PromptAssemblerState.TERMINATED);
  });

  it("should not allow transitions from TERMINATED", () => {
    sm.transition(PromptAssemblerState.TERMINATED);
    expect(sm.canTransition(PromptAssemblerState.IDLE)).toBe(false);
  });
});
