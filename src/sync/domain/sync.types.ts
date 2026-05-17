import type { ProviderType, StorageType } from "@/common/types.ts";
export interface SyncJobContext {
  userId: string;
  trackedRepoId: string;
  integrationId: string;
  storageIntegrationId: string;
  providerType: ProviderType;
  storageType: StorageType;
  repoFullName: string;
  ownerLogin: string;
  repoName: string;
  defaultBranch: string;
  storagePath: string;
  cloneUrl: string;
}

export interface SyncJobResult {
  bundlePath: string;
  storageKey: string;
  sizeBytes: number;
  checksum: string;
  durationMs: number;
}

export interface SyncMetadata {
  commitSha: string | null;
  branch: string;
  commitMessage: string | null;
  commitAuthor: string | null;
  timestamp: Date;
}

export interface WebhookEvent {
  provider: ProviderType;
  repoExternalId: string;
  repoFullName: string;
  branch: string;
  commitSha: string;
  commitMessage: string | null;
  commitAuthor: string | null;
  deliveryId: string;
}
