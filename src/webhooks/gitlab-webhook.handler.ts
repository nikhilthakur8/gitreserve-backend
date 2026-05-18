import { createChildLogger } from "@/common/logger.ts";
import type { RepositoryRepositoryPort } from "@/repositories/db/repository.repository.port.ts";
import type { IntegrationRepositoryPort } from "@/integrations/db/integration.repository.port.ts";
import type { OAuthCredentials } from "@/integrations/domain/integration.types.ts";
import { createProvider } from "@/providers/provider.factory.ts";
import { SyncError } from "@/sync/domain/sync.error.ts";
import { SyncJobPublisher } from "@/sync/queue/sync-job.publisher.ts";
import { buildSyncJobPayload } from "@/sync/queue/sync-job.mapper.ts";
import { mapGitlabPushEvent } from "./webhook-event.mapper.ts";
import type { SyncJobContext } from "@/sync/domain/sync.types.ts";
import type { SyncJobRepositoryPort } from "@/sync/db/sync-job.repository.port.ts";

const logger = createChildLogger("gitlab-webhook");

export class GitlabWebhookHandler {
  constructor(
    private readonly repoRepo: RepositoryRepositoryPort,
    private readonly integrationRepo: IntegrationRepositoryPort,
    private readonly syncJobRepo: SyncJobRepositoryPort,
    private readonly publisher: SyncJobPublisher,
  ) {}

  async handle(
    trackedRepoId: string,
    headers: Record<string, string | string[] | undefined>,
    rawBody: Buffer,
  ): Promise<void> {
    const event = headers["x-gitlab-event"] as string;
    if (event !== "Push Hook") {
      logger.debug({ event }, "Ignoring non-push event");
      return;
    }

    const repo = await this.repoRepo.findById(trackedRepoId);
    if (!repo || repo.providerType !== "gitlab") {
      throw new SyncError("Tracked repository not found", "REPO_NOT_TRACKED");
    }

    if (repo.status === "paused") {
      logger.info({ trackedRepoId }, "Skipping webhook — repository is paused");
      return;
    }

    if (repo.webhook.webhookSecret) {
      const token = headers["x-gitlab-token"] as string;
      if (token !== repo.webhook.webhookSecret) {
        throw new SyncError("Invalid webhook token", "INVALID_WEBHOOK");
      }
    }

    const deliveryId = (headers["x-gitlab-event-uuid"] as string) ?? crypto.randomUUID();
    const payload = JSON.parse(rawBody.toString()) as Record<string, unknown>;
    const webhookEvent = mapGitlabPushEvent(payload, deliveryId);

    if (webhookEvent.branch !== repo.source.defaultBranch) {
      logger.debug({ branch: webhookEvent.branch, defaultBranch: repo.source.defaultBranch }, "Ignoring non-default branch push");
      return;
    }

    const integration = await this.integrationRepo.findById(repo.integrationId);
    if (!integration || integration.status !== "active") {
      throw new SyncError("Git integration is inactive", "INTEGRATION_INACTIVE");
    }

    const credentials = integration.credentials as OAuthCredentials;
    const provider = createProvider("gitlab", { token: credentials.accessToken });
    const cloneUrl = await provider.getAuthenticatedCloneUrl(repo.source.ownerLogin, repo.source.name);

    const context: SyncJobContext = {
      userId: repo.userId,
      trackedRepoId,
      integrationId: repo.integrationId,
      storageIntegrationId: repo.storageIntegrationId,
      providerType: "gitlab",
      storageType: repo.storageType,
      repoFullName: repo.source.fullName,
      ownerLogin: repo.source.ownerLogin,
      repoName: repo.source.name,
      defaultBranch: repo.source.defaultBranch,
      storagePath: repo.storagePath,
      cloneUrl,
    };

    const commit: { sha?: string; message?: string; author?: string } = {
      sha: webhookEvent.commitSha,
    };
    if (webhookEvent.commitMessage) commit.message = webhookEvent.commitMessage;
    if (webhookEvent.commitAuthor) commit.author = webhookEvent.commitAuthor;

    const job = await this.syncJobRepo.create({
      status: "pending",
      trigger: "webhook",
      context,
    });

    const jobPayload = buildSyncJobPayload(job.id, trackedRepoId, "webhook", context, commit);

    await this.publisher.publish(jobPayload);

    logger.info(
      { trackedRepoId, deliveryId, commitSha: webhookEvent.commitSha },
      "GitLab push event queued for sync",
    );
  }
}
