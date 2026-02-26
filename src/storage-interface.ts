/**
 * Prompt Assembler — Storage Interface
 * Organelle: ORGN-AI-PROMPT_ASSEMBLER-v0.1.0
 */

import { PromptAssemblerConfig, PromptAssemblerResult, AuditEntry } from "./types";

export interface IPromptAssemblerStorage {
  saveConfig(config: PromptAssemblerConfig): Promise<void>;
  loadConfig(id: string): Promise<PromptAssemblerConfig | null>;
  saveResult(result: PromptAssemblerResult): Promise<void>;
  loadResult(requestId: string): Promise<PromptAssemblerResult | null>;
  saveAuditEntry(entry: AuditEntry): Promise<void>;
  queryAuditLog(organelleId: string, limit: number): Promise<AuditEntry[]>;
  clear(): Promise<void>;
}

export class InMemoryPromptAssemblerStorage implements IPromptAssemblerStorage {
  private configs: Map<string, PromptAssemblerConfig> = new Map();
  private results: Map<string, PromptAssemblerResult> = new Map();
  private auditEntries: AuditEntry[] = [];

  async saveConfig(config: PromptAssemblerConfig): Promise<void> {
    this.configs.set(config.id, { ...config });
  }

  async loadConfig(id: string): Promise<PromptAssemblerConfig | null> {
    return this.configs.get(id) ?? null;
  }

  async saveResult(result: PromptAssemblerResult): Promise<void> {
    this.results.set(result.requestId, { ...result });
  }

  async loadResult(requestId: string): Promise<PromptAssemblerResult | null> {
    return this.results.get(requestId) ?? null;
  }

  async saveAuditEntry(entry: AuditEntry): Promise<void> {
    this.auditEntries.push({ ...entry });
  }

  async queryAuditLog(organelleId: string, limit: number): Promise<AuditEntry[]> {
    return this.auditEntries
      .filter((e) => e.organelleId === organelleId)
      .slice(-limit);
  }

  async clear(): Promise<void> {
    this.configs.clear();
    this.results.clear();
    this.auditEntries.length = 0;
  }
}
