import { BaseClient } from "@/providers/base/base.client.ts";
import { GITLAB_API_BASE_URL, GITLAB_API_VERSION } from "./gitlab.constants.ts";
import type { GitlabApiError } from "./gitlab.types.ts";

export class GitlabClient extends BaseClient {
  constructor(token: string, baseUrl?: string) {
    const host = baseUrl ?? GITLAB_API_BASE_URL;
    super({
      baseUrl: `${host}/api/${GITLAB_API_VERSION}`,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  }

  protected extractErrorMessage(body: unknown, status: number): string {
    const apiError = body as GitlabApiError | undefined;
    if (typeof apiError?.message === "string") return apiError.message;
    if (apiError?.message && typeof apiError.message === "object") {
      const parts = Object.entries(apiError.message)
        .map(([field, errors]) => `${field} ${errors.join(", ")}`)
        .join("; ");
      if (parts) return parts;
    }
    if (apiError?.error) return apiError.error;
    return `GitLab API error: ${status}`;
  }
}
