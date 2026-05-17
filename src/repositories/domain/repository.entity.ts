import type { ProviderType, StorageType } from "@/common/types.ts";
import type {
  SyncMode,
  TrackedRepoStatus,
  RepoSource,
  SyncInfo,
  WebhookInfo,
} from "./repository.types.ts";

export interface TrackedRepository {
  id: string;
  userId: string;
  integrationId: string;
  storageIntegrationId: string;
  providerType: ProviderType;
  storageType: StorageType;
  syncMode: SyncMode;
  status: TrackedRepoStatus;
  source: RepoSource;
  sync: SyncInfo;
  webhook: WebhookInfo;
  storagePath: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTrackedRepoInput {
  userId: string;
  integrationId: string;
  storageIntegrationId: string;
  providerType: ProviderType;
  storageType: StorageType;
  syncMode: SyncMode;
  source: RepoSource;
  storagePath: string;
}

export interface UpdateTrackedRepoInput {
  status?: TrackedRepoStatus;
  syncMode?: SyncMode;
  sync?: Partial<SyncInfo>;
  webhook?: Partial<WebhookInfo>;
}
