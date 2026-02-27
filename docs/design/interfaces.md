# PromptAssembler — Interface Contracts

## Primary Interface

```typescript
interface IPromptAssembler {
  readonly id: string;
  readonly state: PromptAssemblerState;
  
  execute(command: PromptAssemblerCommand): Promise<PromptAssemblerResult>;
  query(query: PromptAssemblerQuery): PromptAssemblerQueryResult;
  reset(): void;
  terminate(): void;
  getMetrics(): OperationMetrics;
}
```

## Storage Interface

```typescript
interface IPromptAssemblerStorage {
  save(entity: PromptAssemblerEntity): Promise<void>;
  load(id: string): Promise<PromptAssemblerEntity | null>;
  delete(id: string): Promise<boolean>;
}
```

## Event Interface

```typescript
interface IPromptAssemblerEvents {
  emit(event: PromptAssemblerEvent): void;
  subscribe(handler: (event: PromptAssemblerEvent) => void): () => void;
}
```
