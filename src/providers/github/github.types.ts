export interface GithubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

export interface GithubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  default_branch: string;
  clone_url: string;
  html_url: string;
  owner: GithubOwner;
}

export interface GithubOwner {
  id: number;
  login: string;
  avatar_url: string;
}

export interface GithubWebhook {
  id: number;
  config: {
    url: string;
    content_type: string;
  };
  events: string[];
  active: boolean;
}

export interface GithubApiError {
  message: string;
  documentation_url?: string;
  errors?: Array<{ resource?: string; code?: string; message?: string }>;
}
