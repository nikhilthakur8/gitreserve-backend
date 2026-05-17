import type { IntegrationStatus, IntegrationType } from "@/common/types.ts";

export interface OAuthCredentials {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
  scopes: string[];
}

export interface StorageCredentials {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

export type IntegrationCredentials = OAuthCredentials | StorageCredentials;

export interface IntegrationMetadata {
  username: string | null;
  avatarUrl: string | null;
  email: string | null;
  serverUrl: string | null;
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  authorizationUrl: string;
  tokenUrl: string;
}

export interface OAuthTokenResponse {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number | null;
  tokenType: string;
  scope: string;
}

export interface IntegrationFilter {
  userId?: string;
  type?: IntegrationType;
  status?: IntegrationStatus;
}
