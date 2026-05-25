import { Schema, model } from "mongoose";

const oauthAccountSchema = new Schema(
  {
    provider: { type: String, required: true, enum: ["github", "google"] },
    providerId: { type: String, required: true },
    email: { type: String, required: true },
    avatarUrl: { type: String },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, default: null },
    name: { type: String, required: true, trim: true },
    avatarUrl: { type: String },
    oauthAccounts: { type: [oauthAccountSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema.index({ "oauthAccounts.provider": 1, "oauthAccounts.providerId": 1 });

export const UserModel = model("User", userSchema);
