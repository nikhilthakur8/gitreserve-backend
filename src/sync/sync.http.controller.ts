import type { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/common/api-response.ts";
import type { AppRequest } from "@/common/async-handler.ts";
import type { RepositoryRepositoryPort } from "@/repositories/db/repository.repository.port.ts";
import { SyncError } from "./domain/sync.error.ts";
import { SYNC_ERROR_STATUS_MAP } from "./sync.constants.ts";
import { mapToSyncStatusResponse, mapSyncJobToResponse } from "./sync.mapper.ts";
import type { RepositorySyncService } from "./services/repository-sync.service.ts";

export class SyncController {
  constructor(
    private readonly syncService: RepositorySyncService,
    private readonly repoRepo: RepositoryRepositoryPort,
  ) {}

  async triggerSync(req: AppRequest) {
    const userId = req.userId!;
    const { repoId } = req.params;
    const job = await this.syncService.triggerSync(userId, repoId!, "manual");
    return ApiResponse.created(mapSyncJobToResponse(job));
  }

  async getSyncStatus(req: AppRequest) {
    const userId = req.userId!;
    const { repoId } = req.params;
    const repo = await this.repoRepo.findById(repoId!);

    if (!repo || repo.userId !== userId) {
      throw new SyncError("Tracked repository not found", "REPO_NOT_TRACKED");
    }

    return ApiResponse.ok(mapToSyncStatusResponse(repo));
  }

  async getJob(req: AppRequest) {
    const { jobId } = req.params;
    const job = await this.syncService.getJob(jobId!);
    return ApiResponse.ok(mapSyncJobToResponse(job));
  }

  async listJobs(req: AppRequest) {
    const userId = req.userId!;
    const trackedRepoId = req.query["trackedRepoId"];
    const jobs = await this.syncService.listJobs(userId, trackedRepoId);
    return ApiResponse.ok(jobs.map(mapSyncJobToResponse));
  }

  handleError = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
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
