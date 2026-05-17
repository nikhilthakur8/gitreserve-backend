export const SYNC_MODES = ["webhook", "daily"] as const;

export const TRACKED_REPO_STATUSES = [
  "active",
  "paused",
  "syncing",
  "error",
] as const;
