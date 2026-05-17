import { createStorageProvider } from "@/storage/storage.factory.ts";
import type { IntegrationRepositoryPort } from "@/integrations/db/integration.repository.port.ts";
import type { Integration } from "@/integrations/domain/integration.entity.ts";
import type { StorageCredentials } from "@/integrations/domain/integration.types.ts";
import type { IntegrationHandler } from "@/integrations/interfaces/integration-handler.interface.ts";
import { IntegrationError } from "@/integrations/errors/integration.error.ts";

export class StorageIntegrationService implements IntegrationHandler {
  constructor(
    private readonly repo: IntegrationRepositoryPort,
    private readonly storageType: "s3" | "r2",
  ) {}

  async connect(userId: string, payload: unknown): Promise<Integration> {
    const credentials = payload as StorageCredentials;

    const existing = await this.repo.findOne({ userId, type: this.storageType });
    if (existing) {
      throw new IntegrationError(
        `${this.storageType.toUpperCase()} is already connected`,
        this.storageType,
        "ALREADY_CONNECTED",
      );
    }

    await this.testConnection(credentials);

    return this.repo.create({
      userId,
      type: this.storageType,
      credentials,
      metadata: {
        username: null,
        avatarUrl: null,
        email: null,
        serverUrl: credentials.endpoint,
      },
    });
  }

  async disconnect(userId: string): Promise<void> {
    const integration = await this.repo.findOne({ userId, type: this.storageType });
    if (!integration) {
      throw new IntegrationError(
        `${this.storageType.toUpperCase()} integration not found`,
        this.storageType,
        "INTEGRATION_NOT_FOUND",
      );
    }
    await this.repo.delete(integration.id);
  }

  async verify(userId: string): Promise<Integration> {
    const integration = await this.repo.findOne({ userId, type: this.storageType });
    if (!integration) {
      throw new IntegrationError(
        `${this.storageType.toUpperCase()} integration not found`,
        this.storageType,
        "INTEGRATION_NOT_FOUND",
      );
    }

    const credentials = integration.credentials as StorageCredentials;
    try {
      await this.testConnection(credentials);
      return integration;
    } catch (error) {
      await this.repo.update(integration.id, { status: "error" });
      throw new IntegrationError(
        `${this.storageType.toUpperCase()} connection test failed`,
        this.storageType,
        "CONNECTION_TEST_FAILED",
        error,
      );
    }
  }

  private async testConnection(credentials: StorageCredentials): Promise<void> {
    const provider = createStorageProvider({
      type: this.storageType,
      ...credentials,
    });
    const testKey = `.gitreserve-connection-test-${Date.now()}`;

    try {
      await provider.upload({
        key: testKey,
        body: Buffer.from("test"),
        contentType: "text/plain",
      });
      await provider.delete(testKey);
    } catch (error) {
      throw new IntegrationError(
        "Failed to connect to storage",
        this.storageType,
        "INVALID_CREDENTIALS",
        error,
      );
    }
  }
}
