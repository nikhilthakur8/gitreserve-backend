import type { Request, Response, NextFunction } from "express";
import { RepositoryTrackingService } from "./services/repository-tracking.service.ts";
import { RepositorySyncService } from "./services/repository-sync.service.ts";
import { RepositoryWebhookService } from "./services/repository-webhook.service.ts";
import { mapTrackedRepoToResponse } from "./repositories.mapper.ts";
import { RepositoryError } from "./errors/repository.error.ts";
import { REPOSITORY_ERROR_STATUS_MAP } from "./repositories.constants.ts";
import { ApiResponse } from "@/common/api-response.ts";
import type { AppRequest } from "@/common/async-handler.ts";
import type { RepositoryRepositoryPort } from "./db/repository.repository.port.ts";
import type { IntegrationRepositoryPort } from "@/integrations/db/integration.repository.port.ts";
import type { ProviderType } from "@/common/types.ts";
import type { TrackRepoDto } from "./dto/repository.dto.ts";

export class RepositoryController {
  private readonly trackingService: RepositoryTrackingService;
  private readonly syncService: RepositorySyncService;
  private readonly webhookService: RepositoryWebhookService;

  constructor(
    repoRepo: RepositoryRepositoryPort,
    integrationRepo: IntegrationRepositoryPort,
    webhookBaseUrl: string,
  ) {
    this.trackingService = new RepositoryTrackingService(repoRepo, integrationRepo);
    this.syncService = new RepositorySyncService(repoRepo, integrationRepo);
    this.webhookService = new RepositoryWebhookService(repoRepo, integrationRepo, webhookBaseUrl);
  }

  async listAvailable(req: AppRequest) {
    const userId = req.userId!;
    const { type } = req.params;
    const repos = await this.trackingService.listAvailableRepos(userId, type as ProviderType);
    return ApiResponse.ok(repos);
  }

  async track(req: AppRequest) {
    const userId = req.userId!;
    const dto = req.body as TrackRepoDto;

    const tracked = await this.trackingService.track(userId, dto);

    if (dto.syncMode === "webhook") {
      await this.webhookService.setupWebhook(userId, tracked.id);
    }

    return ApiResponse.created(mapTrackedRepoToResponse(tracked));
  }

  async list(req: AppRequest) {
    const userId = req.userId!;
    const repos = await this.trackingService.listTracked(userId);
    return ApiResponse.ok(repos.map(mapTrackedRepoToResponse));
  }

  async get(req: AppRequest) {
    const userId = req.userId!;
    const { repoId } = req.params;
    const repo = await this.trackingService.getTracked(userId, repoId!);
    return ApiResponse.ok(mapTrackedRepoToResponse(repo));
  }

  async untrack(req: AppRequest) {
    const userId = req.userId!;
    const { repoId } = req.params;
    await this.webhookService.removeWebhook(userId, repoId!);
    await this.trackingService.untrack(userId, repoId!);
    return ApiResponse.noContent();
  }

  async sync(req: AppRequest) {
    const userId = req.userId!;
    const { repoId } = req.params;
    const repo = await this.syncService.triggerSync(userId, repoId!);
    return ApiResponse.ok(mapTrackedRepoToResponse(repo));
  }

  handleError = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
    if (err instanceof RepositoryError) {
      res.status(REPOSITORY_ERROR_STATUS_MAP[err.code] ?? 500).json({
        error: err.message,
        code: err.code,
      });
      return;
    }

    res.status(500).json({ error: "Internal server error" });
  };
}
