export type StorageOperation = "upload" | "download" | "delete" | "exists";

export type ProviderType = "github" | "gitlab";

export type StorageType = "s3" | "r2";

export type IntegrationType = "github" | "gitlab" | "s3" | "r2";

export type IntegrationStatus = "active" | "inactive" | "expired" | "error";
