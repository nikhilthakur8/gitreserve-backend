import type { IntegrationStatus, IntegrationType } from "@/common/types.ts";
import type { IntegrationMetadata } from "@/integrations/domain/integration.types.ts";

export interface IntegrationResponseDto {
  id: string;
  userId: string;
  type: IntegrationType;
  status: IntegrationStatus;
  metadata: IntegrationMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectOAuthDto {
  type: IntegrationType;
  code: string;
  state: string;
}

export interface ConnectStorageDto {
  type: "s3" | "r2";
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

export interface OAuthCallbackQuery {
  code: string;
  state: string;
}
