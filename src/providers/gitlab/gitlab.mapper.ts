import type {
  Repository,
  RepositoryOwner,
  User,
  Webhook,
} from "@/providers/provider.types.ts";
import type {
  GitlabProject,
  GitlabUser,
  GitlabWebhook,
} from "./gitlab.types.ts";

export function mapUser(raw: GitlabUser): User {
  return {
    id: String(raw.id),
    login: raw.username,
    name: raw.name,
    email: raw.email,
    avatarUrl: raw.avatar_url,
  };
}

function mapNamespaceToOwner(raw: GitlabProject): RepositoryOwner {
  return {
    id: String(raw.namespace.id),
    login: raw.namespace.path,
    avatarUrl: raw.namespace.avatar_url ?? "",
  };
}

export function mapProject(raw: GitlabProject): Repository {
  return {
    id: String(raw.id),
    name: raw.name,
    fullName: raw.path_with_namespace,
    description: raw.description,
    private: raw.visibility === "private",
    defaultBranch: raw.default_branch,
    cloneUrl: raw.http_url_to_repo,
    htmlUrl: raw.web_url,
    owner: mapNamespaceToOwner(raw),
  };
}

export function mapWebhook(raw: GitlabWebhook): Webhook {
  const events: string[] = [];
  if (raw.push_events) events.push("push");
  if (raw.tag_push_events) events.push("tag_push");
  if (raw.merge_requests_events) events.push("merge_request");

  return {
    id: String(raw.id),
    url: raw.url,
    events,
    active: true,
  };
}
