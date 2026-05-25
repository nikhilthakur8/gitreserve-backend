import type { Request, Response, NextFunction } from "express";
import { pipeline } from "node:stream/promises";
import { RepositoryTrackingService } from "./services/repository-tracking.service.ts";
import { RepositoryWebhookService } from "./services/repository-webhook.service.ts";
import { mapTrackedRepoToResponse } from "./repositories.mapper.ts";
import { RepositoryError } from "./errors/repository.error.ts";
import { REPOSITORY_ERROR_STATUS_MAP } from "./repositories.constants.ts";
import { SyncError } from "@/sync/domain/sync.error.ts";
import { SYNC_ERROR_STATUS_MAP } from "@/sync/sync.constants.ts";
import { ApiResponse } from "@/common/api-response.ts";
import type { AppRequest } from "@/common/async-handler.ts";
import type { RepositoryRepositoryPort } from "./db/repository.repository.port.ts";
import type { IntegrationRepositoryPort } from "@/integrations/db/integration.repository.port.ts";
import type { RepositorySyncService } from "@/sync/services/repository-sync.service.ts";

import type { ProviderType } from "@/common/types.ts";
import type { TrackRepoDto, UpdateTrackedRepoDto } from "./dto/repository.dto.ts";
import type { StorageCredentials } from "@/integrations/domain/integration.types.ts";
import { createStorageProvider } from "@/storage/storage.factory.ts";
import { buildStorageKey } from "@/sync/utils/repo-path.ts";

export class RepositoryController {
  private readonly trackingService: RepositoryTrackingService;
  private readonly syncService: RepositorySyncService;
  private readonly webhookService: RepositoryWebhookService;
  private readonly integrationRepo: IntegrationRepositoryPort;

  constructor(
    repoRepo: RepositoryRepositoryPort,
    integrationRepo: IntegrationRepositoryPort,
    webhookBaseUrl: string,
    syncService: RepositorySyncService,
  ) {
    this.trackingService = new RepositoryTrackingService(repoRepo, integrationRepo);
    this.syncService = syncService;
    this.webhookService = new RepositoryWebhookService(repoRepo, integrationRepo, webhookBaseUrl);
    this.integrationRepo = integrationRepo;
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
      try {
        await this.webhookService.setupWebhook(userId, tracked.id);
      } catch (err) {
        await this.trackingService.untrack(userId, tracked.id);
        throw err;
      }
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

  async update(req: AppRequest) {
    const userId = req.userId!;
    const { repoId } = req.params;
    const dto = req.body as UpdateTrackedRepoDto;

    const existing = await this.trackingService.getTracked(userId, repoId!);

    if (dto.syncMode && dto.syncMode !== existing.syncMode) {
      if (dto.syncMode === "webhook") {
        await this.webhookService.setupWebhook(userId, repoId!);
      } else if (existing.syncMode === "webhook") {
        await this.webhookService.removeWebhook(userId, repoId!);
      }
    }

    const updated = await this.trackingService.update(userId, repoId!, dto);
    return ApiResponse.ok(mapTrackedRepoToResponse(updated));
  }

  async untrack(req: AppRequest) {
    const userId = req.userId!;
    const { repoId } = req.params;
    await this.webhookService.removeWebhook(userId, repoId!);
    await this.trackingService.untrack(userId, repoId!);
    return ApiResponse.noContent();
  }

  download = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.headers["x-user-id"] as string;
      const { repoId } = req.params;

      const repo = await this.trackingService.getTracked(userId, String(repoId));

      if (!repo.sync.lastSyncedAt) {
        res.status(404).json({ error: "No backup available. Trigger a sync first." });
        return;
      }

      const storageIntegration = await this.integrationRepo.findById(repo.storageIntegrationId);
      if (!storageIntegration || storageIntegration.status !== "active") {
        res.status(400).json({ error: "Storage integration is inactive" });
        return;
      }

      const creds = storageIntegration.credentials as StorageCredentials;
      const provider = createStorageProvider({
        type: storageIntegration.type as "s3" | "r2",
        endpoint: creds.endpoint,
        region: creds.region,
        accessKeyId: creds.accessKeyId,
        secretAccessKey: creds.secretAccessKey,
        bucket: creds.bucket,
      });

      const storageKey = buildStorageKey(repo.storagePath);

      const exists = await provider.exists(storageKey);
      if (!exists) {
        res.status(404).json({ error: "Backup file not found in storage" });
        return;
      }

      const file = await provider.download(storageKey);
      const filename = `${repo.source.name}.bundle`;

      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      if (file.size > 0) res.setHeader("Content-Length", file.size);

      await pipeline(file.body, res);
    } catch (err) {
      next(err);
    }
  };

  async sync(req: AppRequest) {
    const userId = req.userId!;
    const { repoId } = req.params;
    await this.syncService.triggerSync(userId, repoId!, "manual");
    const repo = await this.trackingService.getTracked(userId, repoId!);
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

    if (err instanceof SyncError) {
      res.status(SYNC_ERROR_STATUS_MAP[err.code] ?? 500).json({
        error: err.message,
        code: err.code,
      });
      return;
    }

    res.status(500).json({ error: "Internal server error" });
  };
}
