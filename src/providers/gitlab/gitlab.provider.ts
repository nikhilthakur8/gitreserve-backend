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
import { GitlabClient } from "./gitlab.client.ts";
import { GITLAB_DEFAULT_PER_PAGE, GITLAB_MAX_PER_PAGE } from "./gitlab.constants.ts";
import { mapProject, mapUser, mapWebhook } from "./gitlab.mapper.ts";
import type {
  GitlabProject,
  GitlabUser,
  GitlabWebhook,
} from "./gitlab.types.ts";

export class GitlabProvider extends BaseProvider implements GitProvider {
  readonly providerName = "gitlab";
  private readonly client: GitlabClient;
  private readonly token: string;
  private readonly host: string;

  constructor(token: string, baseUrl?: string) {
    super();
    this.token = token;
    this.host = baseUrl ?? "https://gitlab.com";
    this.client = new GitlabClient(token, baseUrl);
  }

  async getAuthenticatedUser(): Promise<User> {
    const raw = await this.client.get<GitlabUser>("/user");
    return mapUser(raw);
  }

  async listRepositories(
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<Repository>> {
    const { page, perPage } = this.normalizePagination(
      pagination, GITLAB_DEFAULT_PER_PAGE, GITLAB_MAX_PER_PAGE,
    );
    const raw = await this.client.get<GitlabProject[]>("/projects", {
      membership: "true", order_by: "updated_at", sort: "desc",
      page, per_page: perPage,
    });
    return this.buildPaginatedResponse(raw.map(mapProject), page, perPage);
  }

  async getRepository(owner: string, repo: string): Promise<Repository> {
    const projectPath = encodeURIComponent(`${owner}/${repo}`);
    const raw = await this.client.get<GitlabProject>(`/projects/${projectPath}`);
    return mapProject(raw);
  }

  async getAuthenticatedCloneUrl(owner: string, repo: string): Promise<string> {
    return `https://oauth2:${this.token}@${new URL(this.host).host}/${owner}/${repo}.git`;
  }

  async createWebhook(
    owner: string,
    repo: string,
    input: CreateWebhookInput,
  ): Promise<Webhook> {
    const projectPath = encodeURIComponent(`${owner}/${repo}`);
    const isHttps = input.url.startsWith("https://");
    const raw = await this.client.post<GitlabWebhook>(
      `/projects/${projectPath}/hooks`,
      {
        url: input.url,
        token: input.secret,
        push_events: input.events.includes("push"),
        tag_push_events: input.events.includes("tag_push"),
        merge_requests_events: input.events.includes("merge_request"),
        enable_ssl_verification: isHttps,
      },
    );
    return mapWebhook(raw);
  }

  async deleteWebhook(owner: string, repo: string, hookId: string): Promise<void> {
    const projectPath = encodeURIComponent(`${owner}/${repo}`);
    await this.client.delete(`/projects/${projectPath}/hooks/${hookId}`);
  }
}
