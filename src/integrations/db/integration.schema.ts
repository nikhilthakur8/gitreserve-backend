import { Schema, model } from "mongoose";
import { INTEGRATION_STATUSES, INTEGRATION_TYPES } from "@/integrations/domain/integration.enums.ts";

const integrationSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, required: true, enum: INTEGRATION_TYPES },
    status: { type: String, required: true, enum: INTEGRATION_STATUSES, default: "active" },
    credentials: { type: Schema.Types.Mixed, required: true },
    metadata: {
      username: { type: String, default: null },
      avatarUrl: { type: String, default: null },
      email: { type: String, default: null },
      serverUrl: { type: String, default: null },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

integrationSchema.index({ userId: 1, type: 1 });

export const IntegrationModel = model("Integration", integrationSchema);
