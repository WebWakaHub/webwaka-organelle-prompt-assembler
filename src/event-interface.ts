/**
 * PromptAssembler — Event Interface
 * Organelle: ORGN-AI-PROMPT_ASSEMBLER-v0.1.0
 */

import { PromptAssemblerEvent } from "./types";

type EventHandler = (event: PromptAssemblerEvent) => void;

export interface IPromptAssemblerEvents {
  emit(event: PromptAssemblerEvent): void;
  subscribe(handler: EventHandler): () => void;
  getEventCount(): number;
}

export class PromptAssemblerEventBus implements IPromptAssemblerEvents {
  private readonly handlers: Set<EventHandler>;
  private eventCount: number;
  private readonly eventLog: PromptAssemblerEvent[];

  constructor() {
    this.handlers = new Set();
    this.eventCount = 0;
    this.eventLog = [];
  }

  emit(event: PromptAssemblerEvent): void {
    this.eventCount++;
    this.eventLog.push(event);
    for (const handler of this.handlers) {
      try {
        handler(event);
      } catch (error) {
        console.error(`Event handler error:`, error);
      }
    }
  }

  subscribe(handler: EventHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  getEventCount(): number {
    return this.eventCount;
  }

  getEventLog(): ReadonlyArray<PromptAssemblerEvent> {
    return [...this.eventLog];
  }
}
