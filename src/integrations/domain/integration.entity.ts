import type { IntegrationStatus, IntegrationType } from "@/common/types.ts";
import type {
  IntegrationCredentials,
  IntegrationMetadata,
} from "./integration.types.ts";

export interface Integration {
  id: string;
  userId: string;
  type: IntegrationType;
  status: IntegrationStatus;
  credentials: IntegrationCredentials;
  metadata: IntegrationMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIntegrationInput {
  userId: string;
  type: IntegrationType;
  credentials: IntegrationCredentials;
  metadata: IntegrationMetadata;
}

export interface UpdateIntegrationInput {
  status?: IntegrationStatus;
  credentials?: IntegrationCredentials;
  metadata?: IntegrationMetadata;
}
