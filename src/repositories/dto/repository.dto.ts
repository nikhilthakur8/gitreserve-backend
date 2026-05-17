import type { ProviderType, StorageType } from "@/common/types.ts";
import type { SyncMode, TrackedRepoStatus } from "../domain/repository.types.ts";

export interface TrackedRepoResponseDto {
  id: string;
  userId: string;
  integrationId: string;
  storageIntegrationId: string;
  providerType: ProviderType;
  storageType: StorageType;
  syncMode: SyncMode;
  status: TrackedRepoStatus;
  source: {
    externalId: string;
    name: string;
    fullName: string;
    ownerLogin: string;
    defaultBranch: string;
    private: boolean;
    htmlUrl: string;
  };
  lastSyncedAt: string | null;
  storagePath: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrackRepoDto {
  integrationId: string;
  storageIntegrationId: string;
  externalRepoId: string;
  syncMode: SyncMode;
}
