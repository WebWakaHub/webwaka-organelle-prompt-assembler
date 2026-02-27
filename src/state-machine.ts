/**
 * PromptAssembler — State Machine
 * Organelle: ORGN-AI-PROMPT_ASSEMBLER-v0.1.0
 */

import { PromptAssemblerState } from "./types";

interface Transition {
  from: PromptAssemblerState;
  to: PromptAssemblerState;
  guard?: () => boolean;
}

export class PromptAssemblerStateMachine {
  private currentState: PromptAssemblerState;
  private readonly transitions: Transition[];
  private readonly history: Array<{ from: PromptAssemblerState; to: PromptAssemblerState; timestamp: number }>;

  constructor(initialState: PromptAssemblerState = PromptAssemblerState.IDLE) {
    this.currentState = initialState;
    this.history = [];
    this.transitions = [
      { from: PromptAssemblerState.IDLE, to: PromptAssemblerState.PROCESSING },
      { from: PromptAssemblerState.PROCESSING, to: PromptAssemblerState.COMPLETED },
      { from: PromptAssemblerState.PROCESSING, to: PromptAssemblerState.ERROR },
      { from: PromptAssemblerState.COMPLETED, to: PromptAssemblerState.IDLE },
      { from: PromptAssemblerState.ERROR, to: PromptAssemblerState.IDLE },
      { from: PromptAssemblerState.IDLE, to: PromptAssemblerState.TERMINATED },
    ];
  }

  getState(): PromptAssemblerState {
    return this.currentState;
  }

  canTransition(to: PromptAssemblerState): boolean {
    return this.transitions.some(
      (t) => t.from === this.currentState && t.to === to && (!t.guard || t.guard())
    );
  }

  transition(to: PromptAssemblerState): void {
    if (!this.canTransition(to)) {
      throw new Error(`Invalid transition: ${this.currentState} → ${to}`);
    }
    this.history.push({ from: this.currentState, to, timestamp: Date.now() });
    this.currentState = to;
  }

  getHistory(): ReadonlyArray<{ from: PromptAssemblerState; to: PromptAssemblerState; timestamp: number }> {
    return [...this.history];
  }

  reset(): void {
    if (this.currentState === PromptAssemblerState.ERROR || this.currentState === PromptAssemblerState.COMPLETED) {
      this.transition(PromptAssemblerState.IDLE);
    }
  }
}
