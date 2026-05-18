import type { RepositoryRepositoryPort } from "../db/repository.repository.port.ts";
import type { IntegrationRepositoryPort } from "@/integrations/db/integration.repository.port.ts";
import type { TrackedRepository } from "../domain/repository.entity.ts";
import type { TrackRepoDto, UpdateTrackedRepoDto } from "../dto/repository.dto.ts";
import type { ProviderType } from "@/common/types.ts";
import type { OAuthCredentials } from "@/integrations/domain/integration.types.ts";
import { createProvider } from "@/providers/provider.factory.ts";
import { RepositoryError } from "../errors/repository.error.ts";

export class RepositoryTrackingService {
  constructor(
    private readonly repoRepo: RepositoryRepositoryPort,
    private readonly integrationRepo: IntegrationRepositoryPort,
  ) {}

  async listAvailableRepos(userId: string, providerType: ProviderType) {
    const integration = await this.integrationRepo.findOne({
      userId,
      type: providerType,
      status: "active",
    });

    if (!integration) {
      throw new RepositoryError(
        `No active ${providerType} integration found`,
        "INTEGRATION_NOT_FOUND",
      );
    }

    const credentials = integration.credentials as OAuthCredentials;
    const provider = createProvider(providerType, { token: credentials.accessToken });

    const result = await provider.listRepositories({ page: 1, perPage: 100 });
    return result.data;
  }

  async track(userId: string, dto: TrackRepoDto): Promise<TrackedRepository> {
    const integration = await this.integrationRepo.findById(dto.integrationId);
    if (!integration || integration.userId !== userId || integration.status !== "active") {
      throw new RepositoryError(
        "Git integration not found or inactive",
        "INTEGRATION_NOT_FOUND",
      );
    }

    const storageIntegration = await this.integrationRepo.findById(dto.storageIntegrationId);
    if (!storageIntegration || storageIntegration.userId !== userId || storageIntegration.status !== "active") {
      throw new RepositoryError(
        "Storage integration not found or inactive",
        "STORAGE_NOT_CONFIGURED",
      );
    }

    const providerType = integration.type as ProviderType;
    const credentials = integration.credentials as OAuthCredentials;
    const provider = createProvider(providerType, { token: credentials.accessToken });

    const repos = await provider.listRepositories({ page: 1, perPage: 100 });
    const repo = repos.data.find((r) => r.id === dto.externalRepoId);
    if (!repo) {
      throw new RepositoryError(
        `Repository ${dto.externalRepoId} not found in provider`,
        "REPO_NOT_FOUND",
      );
    }

    const existing = await this.repoRepo.findOne({
      userId,
      integrationId: dto.integrationId,
    });
    if (existing && existing.source.externalId === dto.externalRepoId) {
      throw new RepositoryError(
        `Repository ${repo.fullName} is already tracked`,
        "REPO_ALREADY_TRACKED",
      );
    }

    const storagePath = `${userId}/${providerType}/${repo.fullName}`;

    return this.repoRepo.create({
      userId,
      integrationId: dto.integrationId,
      storageIntegrationId: dto.storageIntegrationId,
      providerType,
      storageType: storageIntegration.type as "s3" | "r2",
      syncMode: dto.syncMode,
      source: {
        externalId: repo.id,
        name: repo.name,
        fullName: repo.fullName,
        ownerLogin: repo.owner.login,
        defaultBranch: repo.defaultBranch,
        private: repo.private,
        htmlUrl: repo.htmlUrl,
      },
      storagePath,
    });
  }

  async listTracked(userId: string): Promise<TrackedRepository[]> {
    return this.repoRepo.findMany({ userId });
  }

  async getTracked(userId: string, repoId: string): Promise<TrackedRepository> {
    const repo = await this.repoRepo.findById(repoId);
    if (!repo || repo.userId !== userId) {
      throw new RepositoryError("Tracked repository not found", "REPO_NOT_FOUND");
    }
    return repo;
  }

  async update(userId: string, repoId: string, dto: UpdateTrackedRepoDto): Promise<TrackedRepository> {
    const repo = await this.repoRepo.findById(repoId);
    if (!repo || repo.userId !== userId) {
      throw new RepositoryError("Tracked repository not found", "REPO_NOT_FOUND");
    }

    const updated = await this.repoRepo.update(repoId, {
      ...(dto.syncMode ? { syncMode: dto.syncMode } : {}),
      ...(dto.status ? { status: dto.status } : {}),
    });

    return updated!;
  }

  async untrack(userId: string, repoId: string): Promise<void> {
    const repo = await this.repoRepo.findById(repoId);
    if (!repo || repo.userId !== userId) {
      throw new RepositoryError("Tracked repository not found", "REPO_NOT_FOUND");
    }
    await this.repoRepo.delete(repoId);
  }
}
