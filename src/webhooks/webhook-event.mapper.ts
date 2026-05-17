import type { WebhookEvent } from "@/sync/domain/sync.types.ts";

export function mapGithubPushEvent(payload: Record<string, unknown>, deliveryId: string): WebhookEvent {
  const repo = payload["repository"] as Record<string, unknown>;
  const headCommit = payload["head_commit"] as Record<string, unknown> | null;
  const pusher = payload["pusher"] as Record<string, unknown> | null;
  const ref = payload["ref"] as string;

  return {
    provider: "github",
    repoExternalId: String(repo["id"]),
    repoFullName: repo["full_name"] as string,
    branch: ref.replace("refs/heads/", ""),
    commitSha: (payload["after"] as string) ?? "",
    commitMessage: headCommit ? (headCommit["message"] as string) : null,
    commitAuthor: pusher ? (pusher["name"] as string) : null,
    deliveryId,
  };
}

export function mapGitlabPushEvent(payload: Record<string, unknown>, deliveryId: string): WebhookEvent {
  const project = payload["project"] as Record<string, unknown>;
  const ref = payload["ref"] as string;
  const commits = payload["commits"] as Record<string, unknown>[];
  const lastCommit = commits?.length ? commits[commits.length - 1] : null;
  const author = lastCommit?.["author"] as Record<string, unknown> | null;

  return {
    provider: "gitlab",
    repoExternalId: String(project["id"]),
    repoFullName: project["path_with_namespace"] as string,
    branch: ref.replace("refs/heads/", ""),
    commitSha: (payload["after"] as string) ?? "",
    commitMessage: lastCommit ? (lastCommit["message"] as string) : null,
    commitAuthor: author ? (author["name"] as string) : null,
    deliveryId,
  };
}
