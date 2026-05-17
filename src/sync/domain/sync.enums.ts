export const SYNC_JOB_STATUSES = [
  "pending",
  "cloning",
  "bundling",
  "uploading",
  "completed",
  "failed",
] as const;

export type SyncJobStatus = (typeof SYNC_JOB_STATUSES)[number];

export const SYNC_TRIGGERS = ["webhook", "manual", "scheduled"] as const;

export type SyncTrigger = (typeof SYNC_TRIGGERS)[number];
