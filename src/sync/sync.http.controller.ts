import type { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/common/api-response.ts";
import type { AppRequest } from "@/common/async-handler.ts";
import type { RepositoryRepositoryPort } from "@/repositories/db/repository.repository.port.ts";
import { SyncError } from "./domain/sync.error.ts";
import { SYNC_ERROR_STATUS_MAP } from "./sync.constants.ts";
import { mapToSyncStatusResponse, mapSyncJobToResponse } from "./sync.mapper.ts";
import type { RepositorySyncService } from "./services/repository-sync.service.ts";
import type { GithubWebhookHandler } from "./webhooks/github-webhook.handler.ts";
import type { GitlabWebhookHandler } from "./webhooks/gitlab-webhook.handler.ts";

export class SyncController {
  constructor(
    private readonly syncService: RepositorySyncService,
    private readonly repoRepo: RepositoryRepositoryPort,
    private readonly githubWebhook: GithubWebhookHandler,
    private readonly gitlabWebhook: GitlabWebhookHandler,
  ) {}

  async triggerSync(req: AppRequest) {
    const { userId, repoId } = req.params;
    const job = await this.syncService.triggerSync(userId!, repoId!, "manual");
    return ApiResponse.created(mapSyncJobToResponse(job));
  }

  async getSyncStatus(req: AppRequest) {
    const { userId, repoId } = req.params;
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
    const { userId } = req.params;
    const trackedRepoId = req.query["trackedRepoId"];
    const jobs = await this.syncService.listJobs(userId!, trackedRepoId);
    return ApiResponse.ok(jobs.map(mapSyncJobToResponse));
  }

  handleGithubWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const repoId = String(req.params["repoId"]);
      const rawBody = req.body as Buffer;
      await this.githubWebhook.handle(repoId, req.headers as Record<string, string | string[] | undefined>, rawBody);
      res.status(200).json({ received: true });
    } catch (err) {
      next(err);
    }
  };

  handleGitlabWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const repoId = String(req.params["repoId"]);
      const rawBody = req.body as Buffer;
      await this.gitlabWebhook.handle(repoId, req.headers as Record<string, string | string[] | undefined>, rawBody);
      res.status(200).json({ received: true });
    } catch (err) {
      next(err);
    }
  };

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
