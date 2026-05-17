import type { RepositoryRepositoryPort } from "../db/repository.repository.port.ts";
import type { IntegrationRepositoryPort } from "@/integrations/db/integration.repository.port.ts";
import type { OAuthCredentials } from "@/integrations/domain/integration.types.ts";
import { createProvider } from "@/providers/provider.factory.ts";
import { RepositoryError } from "../errors/repository.error.ts";

export class RepositoryWebhookService {
  constructor(
    private readonly repoRepo: RepositoryRepositoryPort,
    private readonly integrationRepo: IntegrationRepositoryPort,
    private readonly webhookBaseUrl: string,
  ) {}

  async setupWebhook(userId: string, repoId: string): Promise<void> {
    const repo = await this.repoRepo.findById(repoId);
    if (!repo || repo.userId !== userId) {
      throw new RepositoryError("Tracked repository not found", "REPO_NOT_FOUND");
    }

    if (repo.webhook.webhookId) return;

    const integration = await this.integrationRepo.findById(repo.integrationId);
    if (!integration || integration.status !== "active") {
      throw new RepositoryError(
        "Git integration is no longer active",
        "INTEGRATION_NOT_FOUND",
      );
    }

    const credentials = integration.credentials as OAuthCredentials;
    const provider = createProvider(repo.providerType, { token: credentials.accessToken });
    const secret = crypto.randomUUID();

    try {
      const webhook = await provider.createWebhook(
        repo.source.ownerLogin,
        repo.source.name,
        {
          url: `${this.webhookBaseUrl}/webhooks/${repo.providerType}/${repoId}`,
          events: ["push"],
          secret,
        },
      );

      await this.repoRepo.update(repoId, {
        webhook: { webhookId: webhook.id, webhookSecret: secret },
      });
    } catch (err) {
      throw new RepositoryError(
        "Failed to register webhook on provider",
        "WEBHOOK_SETUP_FAILED",
        err,
      );
    }
  }

  async removeWebhook(userId: string, repoId: string): Promise<void> {
    const repo = await this.repoRepo.findById(repoId);
    if (!repo || repo.userId !== userId) {
      throw new RepositoryError("Tracked repository not found", "REPO_NOT_FOUND");
    }

    if (!repo.webhook.webhookId) return;

    const integration = await this.integrationRepo.findById(repo.integrationId);
    if (!integration || integration.status !== "active") return;

    const credentials = integration.credentials as OAuthCredentials;
    const provider = createProvider(repo.providerType, { token: credentials.accessToken });

    try {
      await provider.deleteWebhook(
        repo.source.ownerLogin,
        repo.source.name,
        repo.webhook.webhookId,
      );
    } catch {
      // Best-effort cleanup — webhook may already be removed on provider side
    }

    await this.repoRepo.update(repoId, {
      webhook: { webhookId: null, webhookSecret: null },
    });
  }
}
