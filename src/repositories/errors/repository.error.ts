export type RepositoryErrorCode =
  | "REPO_NOT_FOUND"
  | "REPO_ALREADY_TRACKED"
  | "INTEGRATION_NOT_FOUND"
  | "STORAGE_NOT_CONFIGURED"
  | "SYNC_FAILED"
  | "WEBHOOK_SETUP_FAILED"
  | "PROVIDER_ERROR";

export class RepositoryError extends Error {
  constructor(
    message: string,
    public readonly code: RepositoryErrorCode,
    originalError?: unknown,
  ) {
    super(message, { cause: originalError });
    this.name = "RepositoryError";
  }
}
