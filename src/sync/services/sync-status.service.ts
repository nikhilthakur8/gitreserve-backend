import type { RepositoryRepositoryPort } from "@/repositories/db/repository.repository.port.ts";

export class SyncStatusService {
  constructor(private readonly repoRepo: RepositoryRepositoryPort) {}

  async markSyncing(trackedRepoId: string): Promise<void> {
    await this.repoRepo.update(trackedRepoId, { status: "syncing" });
  }

  async markCompleted(trackedRepoId: string): Promise<void> {
    await this.repoRepo.update(trackedRepoId, { status: "active" });
  }

  async markFailed(trackedRepoId: string, error: string): Promise<void> {
    await this.repoRepo.update(trackedRepoId, {
      status: "error",
      sync: { lastSyncError: error },
    });
  }
}
