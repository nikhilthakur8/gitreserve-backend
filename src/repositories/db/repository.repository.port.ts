import type {
  TrackedRepository,
  CreateTrackedRepoInput,
  UpdateTrackedRepoInput,
} from "../domain/repository.entity.ts";
import type { TrackedRepoFilter } from "../domain/repository.types.ts";

export interface RepositoryRepositoryPort {
  create(input: CreateTrackedRepoInput): Promise<TrackedRepository>;
  findById(id: string): Promise<TrackedRepository | null>;
  findOne(filter: TrackedRepoFilter): Promise<TrackedRepository | null>;
  findMany(filter: TrackedRepoFilter): Promise<TrackedRepository[]>;
  update(id: string, input: UpdateTrackedRepoInput): Promise<TrackedRepository | null>;
  delete(id: string): Promise<void>;
}
