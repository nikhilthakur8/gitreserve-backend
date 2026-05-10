import { BaseClient } from "@/providers/base/base.client.ts";
import { GITHUB_API_BASE_URL, GITHUB_API_VERSION } from "./github.constants.ts";
import type { GithubApiError } from "./github.types.ts";

export class GithubClient extends BaseClient {
  constructor(token: string, baseUrl?: string) {
    super({
      baseUrl: baseUrl ?? GITHUB_API_BASE_URL,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
        "Content-Type": "application/json",
      },
    });
  }

  protected extractErrorMessage(body: unknown, status: number): string {
    if (typeof body === "object" && body !== null && "message" in body) {
      return (body as GithubApiError).message;
    }
    return `GitHub API error: ${status}`;
  }
}
