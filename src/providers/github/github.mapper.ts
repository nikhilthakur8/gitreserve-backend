import type {
  Repository,
  RepositoryOwner,
  User,
  Webhook,
} from "@/providers/provider.types.ts";
import type {
  GithubOwner,
  GithubRepository,
  GithubUser,
  GithubWebhook,
} from "./github.types.ts";

export function mapUser(raw: GithubUser): User {
  return {
    id: String(raw.id),
    login: raw.login,
    name: raw.name,
    email: raw.email,
    avatarUrl: raw.avatar_url,
  };
}

export function mapOwner(raw: GithubOwner): RepositoryOwner {
  return {
    id: String(raw.id),
    login: raw.login,
    avatarUrl: raw.avatar_url,
  };
}

export function mapRepository(raw: GithubRepository): Repository {
  return {
    id: String(raw.id),
    name: raw.name,
    fullName: raw.full_name,
    description: raw.description,
    private: raw.private,
    defaultBranch: raw.default_branch,
    cloneUrl: raw.clone_url,
    htmlUrl: raw.html_url,
    owner: mapOwner(raw.owner),
  };
}

export function mapWebhook(raw: GithubWebhook): Webhook {
  return {
    id: String(raw.id),
    url: raw.config.url,
    events: raw.events,
    active: raw.active,
  };
}
