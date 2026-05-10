export type ProviderType = "github" | "gitlab";

export interface ProviderConfig {
  token: string;
  baseUrl?: string;
}

export interface PaginationParams {
  page: number;
  perPage: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  hasNextPage: boolean;
}

export interface Repository {
  id: string;
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
  defaultBranch: string;
  cloneUrl: string;
  htmlUrl: string;
  owner: RepositoryOwner;
}

export interface RepositoryOwner {
  id: string;
  login: string;
  avatarUrl: string;
}

export interface User {
  id: string;
  login: string;
  name: string | null;
  email: string | null;
  avatarUrl: string;
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
}

export interface CreateWebhookInput {
  url: string;
  events: string[];
  secret?: string;
}
