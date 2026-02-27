/**
 * PromptAssembler — Storage Interface
 * Organelle: ORGN-AI-PROMPT_ASSEMBLER-v0.1.0
 */

import { PromptAssemblerState } from "./types";

export interface IPromptAssemblerStorage {
  save(id: string, data: Record<string, unknown>): Promise<void>;
  load(id: string): Promise<Record<string, unknown> | null>;
  delete(id: string): Promise<boolean>;
  list(): Promise<string[]>;
}

export class InMemoryPromptAssemblerStorage implements IPromptAssemblerStorage {
  private readonly store: Map<string, Record<string, unknown>>;

  constructor() {
    this.store = new Map();
  }

  async save(id: string, data: Record<string, unknown>): Promise<void> {
    this.store.set(id, { ...data, updatedAt: Date.now() });
  }

  async load(id: string): Promise<Record<string, unknown> | null> {
    return this.store.get(id) ?? null;
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }

  async list(): Promise<string[]> {
    return Array.from(this.store.keys());
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}
