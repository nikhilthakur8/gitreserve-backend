import type {
  CreateWebhookInput,
  PaginatedResponse,
  PaginationParams,
  Repository,
  User,
  Webhook,
} from "@/providers/provider.types.ts";

export interface GitProvider {
  readonly providerName: string;

  getAuthenticatedUser(): Promise<User>;

  listRepositories(
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<Repository>>;

  getRepository(owner: string, repo: string): Promise<Repository>;

  getAuthenticatedCloneUrl(owner: string, repo: string): Promise<string>;

  createWebhook(
    owner: string,
    repo: string,
    input: CreateWebhookInput,
  ): Promise<Webhook>;

  deleteWebhook(
    owner: string,
    repo: string,
    hookId: string,
  ): Promise<void>;
  
}
