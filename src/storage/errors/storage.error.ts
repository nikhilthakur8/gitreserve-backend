import type { StorageOperation } from "@/common/types.ts";

export class StorageError extends Error {
  constructor(
    message: string,
    public readonly key: string,
    public readonly operation: StorageOperation,
    originalError?: unknown,
  ) {
    super(message, { cause: originalError });
    this.name = "StorageError";
  }
}
