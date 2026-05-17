import type { RepositoryRepositoryPort } from "../db/repository.repository.port.ts";
import type { IntegrationRepositoryPort } from "@/integrations/db/integration.repository.port.ts";
import type { TrackedRepository } from "../domain/repository.entity.ts";
import type { OAuthCredentials } from "@/integrations/domain/integration.types.ts";
import { createProvider } from "@/providers/provider.factory.ts";
import { RepositoryError } from "../errors/repository.error.ts";

export class RepositorySyncService {
  constructor(
    private readonly repoRepo: RepositoryRepositoryPort,
    private readonly integrationRepo: IntegrationRepositoryPort,
  ) {}

  async triggerSync(userId: string, repoId: string): Promise<TrackedRepository> {
    const repo = await this.repoRepo.findById(repoId);
    if (!repo || repo.userId !== userId) {
      throw new RepositoryError("Tracked repository not found", "REPO_NOT_FOUND");
    }

    const integration = await this.integrationRepo.findById(repo.integrationId);
    if (!integration || integration.status !== "active") {
      throw new RepositoryError(
        "Git integration is no longer active",
        "INTEGRATION_NOT_FOUND",
      );
    }

    const storageIntegration = await this.integrationRepo.findById(repo.storageIntegrationId);
    if (!storageIntegration || storageIntegration.status !== "active") {
      throw new RepositoryError(
        "Storage integration is no longer active",
        "STORAGE_NOT_CONFIGURED",
      );
    }

    await this.repoRepo.update(repoId, { status: "syncing" });

    try {
      const credentials = integration.credentials as OAuthCredentials;
      const provider = createProvider(repo.providerType, { token: credentials.accessToken });

      await provider.getAuthenticatedCloneUrl(
        repo.source.ownerLogin,
        repo.source.name,
      );

      // TODO: download archive and upload to storage
      // This will be implemented with the job queue (BullMQ/SQS)

      const updated = await this.repoRepo.update(repoId, {
        status: "active",
        sync: {
          lastSyncedAt: new Date(),
          lastSyncError: null,
        },
      });

      return updated!;
    } catch (err) {
      await this.repoRepo.update(repoId, {
        status: "error",
        sync: {
          lastSyncError: err instanceof Error ? err.message : "Unknown sync error",
        },
      });

      throw new RepositoryError(
        "Failed to sync repository",
        "SYNC_FAILED",
        err,
      );
    }
  }
}
