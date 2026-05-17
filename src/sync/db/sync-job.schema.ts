import { Schema, model } from "mongoose";
import { PROVIDER_TYPES, STORAGE_TYPES } from "@/common/constants.ts";
import { SYNC_JOB_STATUSES, SYNC_TRIGGERS } from "../domain/sync.enums.ts";

const syncJobSchema = new Schema(
  {
    status: {
      type: String,
      required: true,
      enum: SYNC_JOB_STATUSES,
      default: "pending",
    },
    trigger: { type: String, required: true, enum: SYNC_TRIGGERS },
    context: {
      userId: { type: String, required: true },
      trackedRepoId: { type: String, required: true },
      integrationId: { type: String, required: true },
      storageIntegrationId: { type: String, required: true },
      providerType: { type: String, required: true, enum: PROVIDER_TYPES },
      storageType: { type: String, required: true, enum: STORAGE_TYPES },
      repoFullName: { type: String, required: true },
      ownerLogin: { type: String, required: true },
      repoName: { type: String, required: true },
      defaultBranch: { type: String, required: true },
      storagePath: { type: String, required: true },
      cloneUrl: { type: String, required: true },
    },
    metadata: {
      commitSha: { type: String, default: null },
      branch: { type: String, default: null },
      commitMessage: { type: String, default: null },
      commitAuthor: { type: String, default: null },
      timestamp: { type: Date, default: null },
    },
    result: {
      bundlePath: { type: String, default: null },
      storageKey: { type: String, default: null },
      sizeBytes: { type: Number, default: null },
      checksum: { type: String, default: null },
      durationMs: { type: Number, default: null },
    },
    error: { type: String, default: null },
    attempts: { type: Number, default: 0 },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

syncJobSchema.index({ "context.userId": 1, "context.trackedRepoId": 1 });
syncJobSchema.index({ status: 1 });
syncJobSchema.index({ createdAt: -1 });

export const SyncJobModel = model("SyncJob", syncJobSchema);
