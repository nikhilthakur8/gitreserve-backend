import type { RepositoryRepositoryPort } from "./repository.repository.port.ts";
import type {
  TrackedRepository,
  CreateTrackedRepoInput,
  UpdateTrackedRepoInput,
} from "../domain/repository.entity.ts";
import type { TrackedRepoFilter } from "../domain/repository.types.ts";
import { TrackedRepoModel } from "./repository.schema.ts";
import { mapDocumentToTrackedRepo } from "../repositories.mapper.ts";

export class MongoRepositoryRepository implements RepositoryRepositoryPort {
  async create(input: CreateTrackedRepoInput): Promise<TrackedRepository> {
    const doc = await TrackedRepoModel.create(input);
    return mapDocumentToTrackedRepo(doc);
  }

  async findById(id: string): Promise<TrackedRepository | null> {
    const doc = await TrackedRepoModel.findById(id);
    return doc ? mapDocumentToTrackedRepo(doc) : null;
  }

  async findOne(filter: TrackedRepoFilter): Promise<TrackedRepository | null> {
    const doc = await TrackedRepoModel.findOne(this.buildQuery(filter));
    return doc ? mapDocumentToTrackedRepo(doc) : null;
  }

  async findMany(filter: TrackedRepoFilter): Promise<TrackedRepository[]> {
    const docs = await TrackedRepoModel.find(this.buildQuery(filter));
    return docs.map(mapDocumentToTrackedRepo);
  }

  async update(id: string, input: UpdateTrackedRepoInput): Promise<TrackedRepository | null> {
    const update: Record<string, unknown> = {};

    if (input.status) update["status"] = input.status;
    if (input.syncMode) update["syncMode"] = input.syncMode;
    if (input.sync) {
      if (input.sync.lastSyncedAt !== undefined) update["sync.lastSyncedAt"] = input.sync.lastSyncedAt;
      if (input.sync.lastSyncError !== undefined) update["sync.lastSyncError"] = input.sync.lastSyncError;
    }
    if (input.webhook) {
      if (input.webhook.webhookId !== undefined) update["webhook.webhookId"] = input.webhook.webhookId;
      if (input.webhook.webhookSecret !== undefined) update["webhook.webhookSecret"] = input.webhook.webhookSecret;
    }

    const doc = await TrackedRepoModel.findByIdAndUpdate(id, { $set: update }, { returnDocument: "after" });
    return doc ? mapDocumentToTrackedRepo(doc) : null;
  }

  async delete(id: string): Promise<void> {
    await TrackedRepoModel.findByIdAndDelete(id);
  }

  private buildQuery(filter: TrackedRepoFilter): Record<string, unknown> {
    const query: Record<string, unknown> = {};
    if (filter.userId) query["userId"] = filter.userId;
    if (filter.integrationId) query["integrationId"] = filter.integrationId;
    if (filter.storageIntegrationId) query["storageIntegrationId"] = filter.storageIntegrationId;
    if (filter.status) query["status"] = filter.status;
    if (filter.externalId) query["source.externalId"] = filter.externalId;
    if (filter.providerType) query["providerType"] = filter.providerType;
    return query;
  }
}
