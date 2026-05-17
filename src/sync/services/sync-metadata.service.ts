import type { RepositoryRepositoryPort } from "@/repositories/db/repository.repository.port.ts";
import type { SyncMetadata } from "../domain/sync.types.ts";

export class SyncMetadataService {
  constructor(private readonly repoRepo: RepositoryRepositoryPort) {}

  async recordSync(trackedRepoId: string, metadata: SyncMetadata): Promise<void> {
    await this.repoRepo.update(trackedRepoId, {
      sync: {
        lastSyncedAt: metadata.timestamp,
        lastSyncError: null,
      },
    });
  }
}
