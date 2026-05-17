import { Schema, model } from "mongoose";
import { SYNC_MODES, TRACKED_REPO_STATUSES } from "../domain/repository.enums.ts";
import { PROVIDER_TYPES, STORAGE_TYPES } from "@/common/constants.ts";

const trackedRepoSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    integrationId: { type: String, required: true },
    storageIntegrationId: { type: String, required: true },
    providerType: { type: String, required: true, enum: PROVIDER_TYPES },
    storageType: { type: String, required: true, enum: STORAGE_TYPES },
    syncMode: { type: String, required: true, enum: SYNC_MODES, default: "webhook" },
    status: {
      type: String,
      required: true,
      enum: TRACKED_REPO_STATUSES,
      default: "active",
    },
    source: {
      externalId: { type: String, required: true },
      name: { type: String, required: true },
      fullName: { type: String, required: true },
      ownerLogin: { type: String, required: true },
      defaultBranch: { type: String, required: true },
      private: { type: Boolean, required: true },
      htmlUrl: { type: String, required: true },
    },
    sync: {
      lastSyncedAt: { type: Date, default: null },
      lastSyncError: { type: String, default: null },
    },
    webhook: {
      webhookId: { type: String, default: null },
      webhookSecret: { type: String, default: null },
    },
    storagePath: { type: String, required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

trackedRepoSchema.index({ userId: 1, integrationId: 1 });
trackedRepoSchema.index({ userId: 1, "source.externalId": 1, providerType: 1 }, { unique: true });

export const TrackedRepoModel = model("TrackedRepository", trackedRepoSchema);
