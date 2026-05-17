import type { SyncJobStatus, SyncTrigger } from "./sync.enums.ts";
import type { SyncJobContext, SyncJobResult, SyncMetadata } from "./sync.types.ts";

export interface SyncJob {
  id: string;
  status: SyncJobStatus;
  trigger: SyncTrigger;
  context: SyncJobContext;
  metadata: SyncMetadata | null;
  result: SyncJobResult | null;
  error: string | null;
  attempts: number;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSyncJobInput {
  status: SyncJobStatus;
  trigger: SyncTrigger;
  context: SyncJobContext;
}

export interface UpdateSyncJobInput {
  status?: SyncJobStatus;
  metadata?: SyncMetadata;
  result?: SyncJobResult;
  error?: string | null;
  attempts?: number;
  startedAt?: Date;
  completedAt?: Date;
}

export interface SyncJobFilter {
  userId?: string;
  trackedRepoId?: string;
  status?: SyncJobStatus;
  trigger?: SyncTrigger;
}
