import type { Integration } from "@/integrations/domain/integration.entity.ts";

export interface IntegrationHandler {
  connect(userId: string, payload: unknown): Promise<Integration>;
  disconnect(userId: string): Promise<void>;
  verify(userId: string): Promise<Integration>;
}
