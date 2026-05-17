import type {
  SyncJob,
  CreateSyncJobInput,
  UpdateSyncJobInput,
  SyncJobFilter,
} from "../domain/sync-job.entity.ts";

export interface SyncJobRepositoryPort {
  create(input: CreateSyncJobInput): Promise<SyncJob>;
  findById(id: string): Promise<SyncJob | null>;
  findMany(filter: SyncJobFilter): Promise<SyncJob[]>;
  findLatest(trackedRepoId: string): Promise<SyncJob | null>;
  update(id: string, input: UpdateSyncJobInput): Promise<SyncJob | null>;
}
