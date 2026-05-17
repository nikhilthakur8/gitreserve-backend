import type {
  ProviderType,
  StorageType,
  IntegrationType,
  IntegrationStatus,
} from "./types.ts";

export const PROVIDER_TYPES: ProviderType[] = ["github", "gitlab"];

export const STORAGE_TYPES: StorageType[] = ["s3", "r2"];

export const INTEGRATION_TYPES: IntegrationType[] = ["github", "gitlab", "s3", "r2"];

export const INTEGRATION_STATUSES: IntegrationStatus[] = ["active", "inactive", "expired", "error"];

export const OAUTH_GRANT_TYPE = "authorization_code" as const;
