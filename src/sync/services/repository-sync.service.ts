import type { RepositoryRepositoryPort } from "@/repositories/db/repository.repository.port.ts";
import type { IntegrationRepositoryPort } from "@/integrations/db/integration.repository.port.ts";
import type { SyncJobRepositoryPort } from "../db/sync-job.repository.port.ts";
import type { OAuthCredentials } from "@/integrations/domain/integration.types.ts";
import type { ProviderType } from "@/common/types.ts";
import type { SyncJob } from "../domain/sync-job.entity.ts";
import { createProvider } from "@/providers/provider.factory.ts";
import { SyncError } from "../domain/sync.error.ts";
import { SyncJobPublisher } from "../queue/sync-job.publisher.ts";
import { buildSyncJobPayload } from "../queue/sync-job.mapper.ts";
import type { SyncJobContext } from "../domain/sync.types.ts";
import type { SyncTrigger } from "../domain/sync.enums.ts";
import type { SyncJobFilter } from "../domain/sync-job.entity.ts";

export class RepositorySyncService {
  constructor(
    private readonly repoRepo: RepositoryRepositoryPort,
    private readonly integrationRepo: IntegrationRepositoryPort,
    private readonly syncJobRepo: SyncJobRepositoryPort,
    private readonly publisher: SyncJobPublisher,
  ) {}

  async triggerSync(userId: string, trackedRepoId: string, trigger: SyncTrigger = "manual"): Promise<SyncJob> {
    const repo = await this.repoRepo.findById(trackedRepoId);
    if (!repo || repo.userId !== userId) {
      throw new SyncError("Tracked repository not found", "REPO_NOT_TRACKED");
    }

    if (repo.status === "paused") {
      throw new SyncError("Repository is paused", "REPO_PAUSED");
    }

    if (repo.status === "syncing") {
      throw new SyncError("Sync already in progress", "SYNC_IN_PROGRESS");
    }

    const integration = await this.integrationRepo.findById(repo.integrationId);
    if (!integration || integration.status !== "active") {
      throw new SyncError("Git integration is inactive", "INTEGRATION_INACTIVE");
    }

    const storageIntegration = await this.integrationRepo.findById(repo.storageIntegrationId);
    if (!storageIntegration || storageIntegration.status !== "active") {
      throw new SyncError("Storage integration is inactive", "INTEGRATION_INACTIVE");
    }

    const credentials = integration.credentials as OAuthCredentials;
    const provider = createProvider(repo.providerType as ProviderType, { token: credentials.accessToken });
    const cloneUrl = await provider.getAuthenticatedCloneUrl(repo.source.ownerLogin, repo.source.name);

    const context: SyncJobContext = {
      userId,
      trackedRepoId,
      integrationId: repo.integrationId,
      storageIntegrationId: repo.storageIntegrationId,
      providerType: repo.providerType,
      storageType: repo.storageType,
      repoFullName: repo.source.fullName,
      ownerLogin: repo.source.ownerLogin,
      repoName: repo.source.name,
      defaultBranch: repo.source.defaultBranch,
      storagePath: repo.storagePath,
      cloneUrl,
    };

    const job = await this.syncJobRepo.create({
      status: "pending",
      trigger,
      context,
    });

    const payload = buildSyncJobPayload(job.id, trackedRepoId, trigger, context);
    await this.publisher.publish(payload);

    return job;
  }

  async getJob(jobId: string): Promise<SyncJob> {
    const job = await this.syncJobRepo.findById(jobId);
    if (!job) {
      throw new SyncError("Sync job not found", "SYNC_JOB_NOT_FOUND");
    }
    return job;
  }

  async listJobs(userId: string, trackedRepoId?: string): Promise<SyncJob[]> {
    const filter: SyncJobFilter = { userId };
    if (trackedRepoId) filter.trackedRepoId = trackedRepoId;
    return this.syncJobRepo.findMany(filter);
  }

  async getLatestJob(trackedRepoId: string): Promise<SyncJob | null> {
    return this.syncJobRepo.findLatest(trackedRepoId);
  }
}
