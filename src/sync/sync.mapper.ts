import type { TrackedRepository } from "@/repositories/domain/repository.entity.ts";
import type { SyncJob } from "./domain/sync-job.entity.ts";
import type { SyncJobStatus, SyncTrigger } from "./domain/sync.enums.ts";
import type { SyncJobContext, SyncJobResult, SyncMetadata } from "./domain/sync.types.ts";
import type { SyncStatusResponseDto, SyncJobResponseDto } from "./dto/sync.dto.ts";

export function mapToSyncStatusResponse(repo: TrackedRepository): SyncStatusResponseDto {
  return {
    trackedRepoId: repo.id,
    status: repo.status,
    lastSyncedAt: repo.sync.lastSyncedAt?.toISOString() ?? null,
    lastSyncError: repo.sync.lastSyncError,
  };
}

export function mapDocumentToSyncJob(doc: {
  _id: unknown;
  status: string;
  trigger: string;
  context?: unknown;
  metadata?: unknown;
  result?: unknown;
  error?: string | null;
  attempts?: number;
  startedAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): SyncJob {
  return {
    id: String(doc._id),
    status: doc.status as SyncJobStatus,
    trigger: doc.trigger as SyncTrigger,
    context: doc.context as SyncJobContext,
    metadata: (doc.metadata as SyncMetadata) ?? null,
    result: (doc.result as SyncJobResult) ?? null,
    error: doc.error ?? null,
    attempts: doc.attempts ?? 0,
    startedAt: doc.startedAt ?? null,
    completedAt: doc.completedAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function mapSyncJobToResponse(job: SyncJob): SyncJobResponseDto {
  return {
    id: job.id,
    status: job.status,
    trigger: job.trigger,
    context: job.context,
    metadata: job.metadata,
    result: job.result,
    error: job.error,
    attempts: job.attempts,
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}
