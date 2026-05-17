import { createReadStream } from "node:fs";
import { createChildLogger } from "@/common/logger.ts";
import type { StorageProvider } from "@/storage/interfaces/storage.interface.ts";
import type { IntegrationRepositoryPort } from "@/integrations/db/integration.repository.port.ts";
import type { StorageCredentials } from "@/integrations/domain/integration.types.ts";
import { createStorageProvider } from "@/storage/storage.factory.ts";
import type { SyncJobRepositoryPort } from "../db/sync-job.repository.port.ts";
import type { SyncJobContext, SyncJobResult } from "../domain/sync.types.ts";
import type { SyncTrigger } from "../domain/sync.enums.ts";
import { SyncError } from "../domain/sync.error.ts";
import { GitCloneService } from "../git/git-clone.service.ts";
import { GitBundleService } from "../git/git-bundle.service.ts";
import { GitCleanupService } from "../git/git-cleanup.service.ts";
import { GitCommandService } from "../git/git-command.service.ts";
import { SyncMetadataService } from "./sync-metadata.service.ts";
import { SyncStatusService } from "./sync-status.service.ts";
import { createTempDir } from "../utils/temp-dir.ts";
import { buildStorageKey } from "../utils/repo-path.ts";
import { computeFileChecksum } from "../utils/checksum.ts";

const logger = createChildLogger("sync-orchestrator");

export class SyncOrchestrator {
  private readonly gitCmd: GitCommandService;
  private readonly cloneService: GitCloneService;
  private readonly bundleService: GitBundleService;
  private readonly cleanupService: GitCleanupService;

  constructor(
    private readonly integrationRepo: IntegrationRepositoryPort,
    private readonly syncJobRepo: SyncJobRepositoryPort,
    private readonly metadataService: SyncMetadataService,
    private readonly statusService: SyncStatusService,
  ) {
    this.gitCmd = new GitCommandService();
    this.cloneService = new GitCloneService(this.gitCmd);
    this.bundleService = new GitBundleService(this.gitCmd);
    this.cleanupService = new GitCleanupService();
  }

  async execute(
    jobId: string,
    context: SyncJobContext,
    trigger: SyncTrigger,
    commit: { commitSha: string | null; commitMessage: string | null; commitAuthor: string | null },
  ): Promise<SyncJobResult> {
    const startTime = Date.now();
    let tempDir: string | null = null;

    try {
      await this.syncJobRepo.update(jobId, {
        status: "cloning",
        startedAt: new Date(),
        attempts: 1,
      });
      await this.statusService.markSyncing(context.trackedRepoId);

      const storageProvider = await this.resolveStorageProvider(context.storageIntegrationId);

      tempDir = await createTempDir();

      logger.info({ jobId, repo: context.repoFullName, tempDir }, "Cloning repository");
      const cloneResult = await this.cloneService.clone(
        context.cloneUrl,
        tempDir,
        context.repoName,
      );

      await this.syncJobRepo.update(jobId, { status: "bundling" });

      logger.info({ jobId, repo: context.repoFullName }, "Creating bundle");
      const bundleResult = await this.bundleService.createBundle(
        cloneResult.cloneDir,
        tempDir,
        context.repoName,
      );

      const checksum = await computeFileChecksum(bundleResult.bundlePath);
      const storageKey = buildStorageKey(context.storagePath);

      await this.syncJobRepo.update(jobId, { status: "uploading" });

      logger.info({ jobId, repo: context.repoFullName, storageKey, sizeBytes: bundleResult.sizeBytes }, "Uploading bundle");
      await this.uploadBundle(storageProvider, bundleResult.bundlePath, storageKey);

      const durationMs = Date.now() - startTime;
      const result: SyncJobResult = {
        bundlePath: storageKey,
        storageKey,
        sizeBytes: bundleResult.sizeBytes,
        checksum,
        durationMs,
      };

      const metadata = {
        commitSha: commit.commitSha ?? cloneResult.commitSha,
        branch: cloneResult.branch,
        commitMessage: commit.commitMessage ?? cloneResult.commitMessage,
        commitAuthor: commit.commitAuthor ?? cloneResult.commitAuthor,
        timestamp: new Date(),
      };

      await this.syncJobRepo.update(jobId, {
        status: "completed",
        result,
        metadata,
        error: null,
        completedAt: new Date(),
      });

      await this.statusService.markCompleted(context.trackedRepoId);
      await this.metadataService.recordSync(context.trackedRepoId, metadata);

      logger.info(
        { jobId, repo: context.repoFullName, durationMs, sizeBytes: bundleResult.sizeBytes, trigger },
        "Sync completed",
      );

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";

      await this.syncJobRepo.update(jobId, {
        status: "failed",
        error: errorMessage,
        completedAt: new Date(),
      });

      await this.statusService.markFailed(context.trackedRepoId, errorMessage);

      logger.error({ jobId, repo: context.repoFullName, err: errorMessage, trigger }, "Sync failed");

      if (err instanceof SyncError) throw err;
      throw new SyncError("Sync pipeline failed", "UPLOAD_FAILED", err);
    } finally {
      if (tempDir) {
        await this.cleanupService.cleanup(tempDir);
      }
    }
  }

  private async resolveStorageProvider(storageIntegrationId: string): Promise<StorageProvider> {
    const integration = await this.integrationRepo.findById(storageIntegrationId);
    if (!integration || integration.status !== "active") {
      throw new SyncError("Storage integration is inactive or not found", "UPLOAD_FAILED");
    }

    const creds = integration.credentials as StorageCredentials;
    return createStorageProvider({
      type: integration.type as "s3" | "r2",
      endpoint: creds.endpoint,
      region: creds.region,
      accessKeyId: creds.accessKeyId,
      secretAccessKey: creds.secretAccessKey,
      bucket: creds.bucket,
    });
  }

  private async uploadBundle(storageProvider: StorageProvider, bundlePath: string, storageKey: string): Promise<void> {
    const stream = createReadStream(bundlePath);
    try {
      await storageProvider.upload({
        key: storageKey,
        body: stream,
        contentType: "application/octet-stream",
      });
    } catch (err) {
      throw new SyncError("Failed to upload bundle to storage", "UPLOAD_FAILED", err);
    }
  }
}
