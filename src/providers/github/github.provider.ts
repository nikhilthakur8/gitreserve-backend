import { BaseProvider } from "@/providers/base/base.provider.ts";
import type { GitProvider } from "@/providers/interfaces/git-provider.interface.ts";
import type {
  CreateWebhookInput,
  PaginatedResponse,
  PaginationParams,
  Repository,
  User,
  Webhook,
} from "@/providers/provider.types.ts";
import { GithubClient } from "./github.client.ts";
import { GITHUB_DEFAULT_PER_PAGE, GITHUB_MAX_PER_PAGE } from "./github.constants.ts";
import { mapRepository, mapUser, mapWebhook } from "./github.mapper.ts";
import type {
  GithubRepository,
  GithubUser,
  GithubWebhook,
} from "./github.types.ts";

export class GithubProvider extends BaseProvider implements GitProvider {
  readonly providerName = "github";
  private readonly client: GithubClient;
  private readonly token: string;

  constructor(token: string, baseUrl?: string) {
    super();
    this.token = token;
    this.client = new GithubClient(token, baseUrl);
  }

  async getAuthenticatedUser(): Promise<User> {
    const raw = await this.client.get<GithubUser>("/user");
    return mapUser(raw);
  }

  async listRepositories(
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<Repository>> {
    const { page, perPage } = this.normalizePagination(
      pagination, GITHUB_DEFAULT_PER_PAGE, GITHUB_MAX_PER_PAGE,
    );
    const raw = await this.client.get<GithubRepository[]>("/user/repos", {
      page, per_page: perPage, sort: "updated",
    });
    return this.buildPaginatedResponse(raw.map(mapRepository), page, perPage);
  }

  async getRepository(owner: string, repo: string): Promise<Repository> {
    const raw = await this.client.get<GithubRepository>(`/repos/${owner}/${repo}`);
    return mapRepository(raw);
  }

  async getAuthenticatedCloneUrl(owner: string, repo: string): Promise<string> {
    return `https://x-access-token:${this.token}@github.com/${owner}/${repo}.git`;
  }

  async createWebhook(
    owner: string,
    repo: string,
    input: CreateWebhookInput,
  ): Promise<Webhook> {
    const raw = await this.client.post<GithubWebhook>(
      `/repos/${owner}/${repo}/hooks`,
      {
        name: "web",
        config: {
          url: input.url,
          content_type: "json",
          secret: input.secret,
          insecure_ssl: "0",
        },
        events: input.events,
        active: true,
      },
    );
    return mapWebhook(raw);
  }

  async deleteWebhook(owner: string, repo: string, hookId: string): Promise<void> {
    await this.client.delete(`/repos/${owner}/${repo}/hooks/${hookId}`);
  }
}
