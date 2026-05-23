import type { SYNC_MODES, TRACKED_REPO_STATUSES } from "./repository.enums.ts";

export type SyncMode = (typeof SYNC_MODES)[number];
export type TrackedRepoStatus = (typeof TRACKED_REPO_STATUSES)[number];

export interface RepoSource {
  externalId: string;
  name: string;
  fullName: string;
  ownerLogin: string;
  defaultBranch: string;
  private: boolean;
  htmlUrl: string;
}

export interface SyncInfo {
  lastSyncedAt: Date | null;
  lastSyncError: string | null;
}

export interface WebhookInfo {
  webhookId: string | null;
  webhookSecret: string | null;
}

export interface TrackedRepoFilter {
  userId?: string;
  integrationId?: string;
  storageIntegrationId?: string;
  status?: TrackedRepoStatus;
  externalId?: string;
  providerType?: string;
}
