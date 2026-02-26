/**
 * Prompt Assembler — State Machine
 * Organelle: ORGN-AI-PROMPT_ASSEMBLER-v0.1.0
 */

import { PromptAssemblerState, StateTransition } from "./types";

type TransitionGuard = () => boolean;

interface TransitionRule {
  from: PromptAssemblerState;
  to: PromptAssemblerState;
  trigger: string;
  guard?: TransitionGuard;
}

export class PromptAssemblerStateMachine {
  private currentState: PromptAssemblerState;
  private readonly transitions: TransitionRule[];
  private readonly history: StateTransition[];

  constructor(initialState: PromptAssemblerState = PromptAssemblerState.IDLE) {
    this.currentState = initialState;
    this.history = [];
    this.transitions = this.defineTransitions();
  }

  private defineTransitions(): TransitionRule[] {
    return [
      { from: PromptAssemblerState.IDLE, to: PromptAssemblerState.INITIALIZING, trigger: "initialize" },
      { from: PromptAssemblerState.INITIALIZING, to: PromptAssemblerState.READY, trigger: "initialized" },
      { from: PromptAssemblerState.INITIALIZING, to: PromptAssemblerState.ERROR, trigger: "initError" },
      { from: PromptAssemblerState.READY, to: PromptAssemblerState.PROCESSING, trigger: "process" },
      { from: PromptAssemblerState.PROCESSING, to: PromptAssemblerState.COMPLETED, trigger: "complete" },
      { from: PromptAssemblerState.PROCESSING, to: PromptAssemblerState.ERROR, trigger: "processError" },
      { from: PromptAssemblerState.COMPLETED, to: PromptAssemblerState.READY, trigger: "reset" },
      { from: PromptAssemblerState.ERROR, to: PromptAssemblerState.READY, trigger: "recover" },
      { from: PromptAssemblerState.ERROR, to: PromptAssemblerState.TERMINATED, trigger: "terminate" },
      { from: PromptAssemblerState.READY, to: PromptAssemblerState.TERMINATED, trigger: "terminate" },
      { from: PromptAssemblerState.IDLE, to: PromptAssemblerState.TERMINATED, trigger: "terminate" },
    ];
  }

  getState(): PromptAssemblerState {
    return this.currentState;
  }

  getHistory(): ReadonlyArray<StateTransition> {
    return [...this.history];
  }

  canTransition(trigger: string): boolean {
    return this.transitions.some(
      (t) => t.from === this.currentState && t.trigger === trigger
    );
  }

  transition(trigger: string): StateTransition {
    const rule = this.transitions.find(
      (t) => t.from === this.currentState && t.trigger === trigger
    );

    if (!rule) {
      throw new Error(
        `Invalid transition: ${trigger} from state ${this.currentState}`
      );
    }

    const guardResult = rule.guard ? rule.guard() : true;
    if (!guardResult) {
      throw new Error(
        `Transition guard failed: ${trigger} from ${this.currentState}`
      );
    }

    const transition: StateTransition = {
      from: this.currentState,
      to: rule.to,
      trigger,
      timestamp: Date.now(),
      guardResult,
    };

    this.currentState = rule.to;
    this.history.push(transition);
    return transition;
  }

  reset(): void {
    this.currentState = PromptAssemblerState.IDLE;
    this.history.length = 0;
  }
}
