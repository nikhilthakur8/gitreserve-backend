export interface GitlabUser {
  id: number;
  username: string;
  name: string;
  email: string | null;
  avatar_url: string;
}

export interface GitlabProject {
  id: number;
  name: string;
  path_with_namespace: string;
  description: string | null;
  visibility: string;
  default_branch: string;
  http_url_to_repo: string;
  web_url: string;
  namespace: GitlabNamespace;
}

export interface GitlabNamespace {
  id: number;
  name: string;
  path: string;
  avatar_url: string | null;
}

export interface GitlabWebhook {
  id: number;
  url: string;
  push_events: boolean;
  tag_push_events: boolean;
  merge_requests_events: boolean;
  enable_ssl_verification: boolean;
}

export interface GitlabApiError {
  message: string | Record<string, string[]>;
  error?: string;
}
