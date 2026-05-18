import type {
  CreateIntegrationInput,
  Integration,
  UpdateIntegrationInput,
} from "@/integrations/domain/integration.entity.ts";
import type { IntegrationFilter } from "@/integrations/domain/integration.types.ts";
import type { IntegrationRepositoryPort } from "./integration.repository.port.ts";
import { IntegrationModel } from "./integration.schema.ts";
import { mapDocumentToIntegration } from "@/integrations/integrations.mapper.ts";

export class MongoIntegrationRepository implements IntegrationRepositoryPort {
  async create(input: CreateIntegrationInput): Promise<Integration> {
    const doc = await IntegrationModel.create(input);
    return mapDocumentToIntegration(doc);
  }

  async findById(id: string): Promise<Integration | null> {
    const doc = await IntegrationModel.findById(id);
    return doc ? mapDocumentToIntegration(doc) : null;
  }

  async findOne(filter: IntegrationFilter): Promise<Integration | null> {
    const doc = await IntegrationModel.findOne(this.buildQuery(filter));
    return doc ? mapDocumentToIntegration(doc) : null;
  }

  async findMany(filter: IntegrationFilter): Promise<Integration[]> {
    const docs = await IntegrationModel.find(this.buildQuery(filter));
    return docs.map(mapDocumentToIntegration);
  }

  async update(id: string, input: UpdateIntegrationInput): Promise<Integration | null> {
    const doc = await IntegrationModel.findByIdAndUpdate(id, { $set: input }, { returnDocument: "after" });
    return doc ? mapDocumentToIntegration(doc) : null;
  }

  async delete(id: string): Promise<void> {
    await IntegrationModel.findByIdAndDelete(id);
  }

  private buildQuery(filter: IntegrationFilter): Record<string, unknown> {
    const query: Record<string, unknown> = {};
    if (filter.userId) query["userId"] = filter.userId;
    if (filter.type) query["type"] = filter.type;
    if (filter.status) query["status"] = filter.status;
    return query;
  }
}
