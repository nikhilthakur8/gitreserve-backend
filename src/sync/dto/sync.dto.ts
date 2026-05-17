import type { SyncJobStatus, SyncTrigger } from "../domain/sync.enums.ts";
import type { SyncJobContext, SyncJobResult, SyncMetadata } from "../domain/sync.types.ts";

export interface TriggerSyncDto {
  trackedRepoId: string;
  trigger?: SyncTrigger;
}

export interface SyncStatusResponseDto {
  trackedRepoId: string;
  status: string;
  lastSyncedAt: string | null;
  lastSyncError: string | null;
}

export interface SyncJobResponseDto {
  id: string;
  status: SyncJobStatus;
  trigger: SyncTrigger;
  context: SyncJobContext;
  metadata: SyncMetadata | null;
  result: SyncJobResult | null;
  error: string | null;
  attempts: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
