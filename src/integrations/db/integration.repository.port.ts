import type {
  CreateIntegrationInput,
  Integration,
  UpdateIntegrationInput,
} from "@/integrations/domain/integration.entity.ts";
import type { IntegrationFilter } from "@/integrations/domain/integration.types.ts";

export interface IntegrationRepositoryPort {
  create(input: CreateIntegrationInput): Promise<Integration>;
  findById(id: string): Promise<Integration | null>;
  findOne(filter: IntegrationFilter): Promise<Integration | null>;
  findMany(filter: IntegrationFilter): Promise<Integration[]>;
  update(id: string, input: UpdateIntegrationInput): Promise<Integration | null>;
  delete(id: string): Promise<void>;
}
