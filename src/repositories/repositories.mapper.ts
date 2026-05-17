import type { TrackedRepository } from "./domain/repository.entity.ts";
import type { TrackedRepoResponseDto } from "./dto/repository.dto.ts";
import type { ProviderType, StorageType } from "@/common/types.ts";
import type { SyncMode, TrackedRepoStatus, RepoSource, SyncInfo, WebhookInfo } from "./domain/repository.types.ts";

export function mapDocumentToTrackedRepo(doc: {
  _id: unknown;
  userId: string;
  integrationId: string;
  storageIntegrationId: string;
  providerType: string;
  storageType: string;
  syncMode: string;
  status: string;
  source?: unknown;
  sync?: unknown;
  webhook?: unknown;
  storagePath: string;
  createdAt: Date;
  updatedAt: Date;
}): TrackedRepository {
  return {
    id: String(doc._id),
    userId: doc.userId,
    integrationId: doc.integrationId,
    storageIntegrationId: doc.storageIntegrationId,
    providerType: doc.providerType as ProviderType,
    storageType: doc.storageType as StorageType,
    syncMode: doc.syncMode as SyncMode,
    status: doc.status as TrackedRepoStatus,
    source: doc.source as RepoSource,
    sync: (doc.sync ?? { lastSyncedAt: null, lastSyncError: null }) as SyncInfo,
    webhook: (doc.webhook ?? { webhookId: null, webhookSecret: null }) as WebhookInfo,
    storagePath: doc.storagePath,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function mapTrackedRepoToResponse(repo: TrackedRepository): TrackedRepoResponseDto {
  return {
    id: repo.id,
    userId: repo.userId,
    integrationId: repo.integrationId,
    storageIntegrationId: repo.storageIntegrationId,
    providerType: repo.providerType,
    storageType: repo.storageType,
    syncMode: repo.syncMode,
    status: repo.status,
    source: repo.source,
    lastSyncedAt: repo.sync.lastSyncedAt?.toISOString() ?? null,
    storagePath: repo.storagePath,
    createdAt: repo.createdAt.toISOString(),
    updatedAt: repo.updatedAt.toISOString(),
  };
}
