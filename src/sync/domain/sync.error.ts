export type SyncErrorCode =
  | "CLONE_FAILED"
  | "FETCH_FAILED"
  | "BUNDLE_FAILED"
  | "UPLOAD_FAILED"
  | "CLEANUP_FAILED"
  | "INVALID_WEBHOOK"
  | "REPO_NOT_TRACKED"
  | "INTEGRATION_INACTIVE"
  | "SYNC_IN_PROGRESS"
  | "SYNC_JOB_NOT_FOUND";

export class SyncError extends Error {
  constructor(
    message: string,
    public readonly code: SyncErrorCode,
    originalError?: unknown,
  ) {
    super(message, { cause: originalError });
    this.name = "SyncError";
  }
}
