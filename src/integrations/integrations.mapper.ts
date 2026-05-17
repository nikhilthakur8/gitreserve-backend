import type { IntegrationStatus, IntegrationType } from "@/common/types.ts";
import type { Integration } from "@/integrations/domain/integration.entity.ts";
import type {
  IntegrationCredentials,
  IntegrationMetadata,
} from "@/integrations/domain/integration.types.ts";
import type { IntegrationResponseDto } from "@/integrations/dto/integration.dto.ts";

export function mapDocumentToIntegration(doc: {
  _id: unknown;
  userId: string;
  type: string;
  status: string;
  credentials: unknown;
  metadata?: unknown | null;
  createdAt: Date;
  updatedAt: Date;
}): Integration {
  return {
    id: String(doc._id),
    userId: doc.userId,
    type: doc.type as IntegrationType,
    status: doc.status as IntegrationStatus,
    credentials: doc.credentials as IntegrationCredentials,
    metadata: (doc.metadata ?? {
      username: null,
      avatarUrl: null,
      email: null,
      serverUrl: null,
    }) as IntegrationMetadata,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function mapIntegrationToResponse(integration: Integration): IntegrationResponseDto {
  return {
    id: integration.id,
    userId: integration.userId,
    type: integration.type,
    status: integration.status,
    metadata: integration.metadata,
    createdAt: integration.createdAt.toISOString(),
    updatedAt: integration.updatedAt.toISOString(),
  };
}
