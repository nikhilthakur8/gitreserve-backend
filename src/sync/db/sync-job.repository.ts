import type { SyncJobRepositoryPort } from "./sync-job.repository.port.ts";
import type {
  SyncJob,
  CreateSyncJobInput,
  UpdateSyncJobInput,
  SyncJobFilter,
} from "../domain/sync-job.entity.ts";
import { SyncJobModel } from "./sync-job.schema.ts";
import { mapDocumentToSyncJob } from "../sync.mapper.ts";

export class MongoSyncJobRepository implements SyncJobRepositoryPort {
  async create(input: CreateSyncJobInput): Promise<SyncJob> {
    const doc = await SyncJobModel.create(input);
    return mapDocumentToSyncJob(doc);
  }

  async findById(id: string): Promise<SyncJob | null> {
    const doc = await SyncJobModel.findById(id);
    return doc ? mapDocumentToSyncJob(doc) : null;
  }

  async findMany(filter: SyncJobFilter): Promise<SyncJob[]> {
    const query = this.buildQuery(filter);
    const docs = await SyncJobModel.find(query).sort({ createdAt: -1 });
    return docs.map(mapDocumentToSyncJob);
  }

  async findLatest(trackedRepoId: string): Promise<SyncJob | null> {
    const doc = await SyncJobModel
      .findOne({ "context.trackedRepoId": trackedRepoId })
      .sort({ createdAt: -1 });
    return doc ? mapDocumentToSyncJob(doc) : null;
  }

  async update(id: string, input: UpdateSyncJobInput): Promise<SyncJob | null> {
    const update: Record<string, unknown> = {};

    if (input.status) update["status"] = input.status;
    if (input.error !== undefined) update["error"] = input.error;
    if (input.attempts !== undefined) update["attempts"] = input.attempts;
    if (input.startedAt) update["startedAt"] = input.startedAt;
    if (input.completedAt) update["completedAt"] = input.completedAt;

    if (input.metadata) {
      update["metadata.commitSha"] = input.metadata.commitSha;
      update["metadata.branch"] = input.metadata.branch;
      update["metadata.commitMessage"] = input.metadata.commitMessage;
      update["metadata.commitAuthor"] = input.metadata.commitAuthor;
      update["metadata.timestamp"] = input.metadata.timestamp;
    }

    if (input.result) {
      update["result.bundlePath"] = input.result.bundlePath;
      update["result.storageKey"] = input.result.storageKey;
      update["result.sizeBytes"] = input.result.sizeBytes;
      update["result.checksum"] = input.result.checksum;
      update["result.durationMs"] = input.result.durationMs;
    }

    const doc = await SyncJobModel.findByIdAndUpdate(id, { $set: update }, { new: true });
    return doc ? mapDocumentToSyncJob(doc) : null;
  }

  private buildQuery(filter: SyncJobFilter): Record<string, unknown> {
    const query: Record<string, unknown> = {};
    if (filter.userId) query["context.userId"] = filter.userId;
    if (filter.trackedRepoId) query["context.trackedRepoId"] = filter.trackedRepoId;
    if (filter.status) query["status"] = filter.status;
    if (filter.trigger) query["trigger"] = filter.trigger;
    return query;
  }
}
