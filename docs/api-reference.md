# PromptAssembler — API Reference

## Types

### PromptAssemblerConfig
```typescript
interface PromptAssemblerConfig {
  readonly id: string;
  readonly name: string;
  readonly maxConcurrency: number;
  readonly timeoutMs: number;
  readonly retryPolicy: RetryPolicy;
}
```

### PromptAssemblerCommand
```typescript
interface PromptAssemblerCommand {
  readonly type: string;
  readonly payload: Record<string, unknown>;
  readonly correlationId: string;
  readonly timestamp: number;
}
```

### PromptAssemblerResult
```typescript
interface PromptAssemblerResult {
  readonly success: boolean;
  readonly data?: Record<string, unknown>;
  readonly error?: PromptAssemblerError;
  readonly duration: number;
  readonly correlationId: string;
}
```

## State Machine

States: IDLE → PROCESSING → COMPLETED → IDLE (success path)
States: IDLE → PROCESSING → ERROR → IDLE (error path)
States: IDLE → TERMINATED (shutdown path)
