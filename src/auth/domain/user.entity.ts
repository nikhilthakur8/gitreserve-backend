export type OAuthProvider = "github" | "google";

export interface OAuthAccount {
  provider: OAuthProvider;
  providerId: string;
  email: string;
  avatarUrl?: string | undefined;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string | null;
  name: string;
  avatarUrl?: string | undefined;
  oauthAccounts: OAuthAccount[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  passwordHash: string | null;
  name: string;
  avatarUrl?: string | undefined;
  oauthAccounts?: OAuthAccount[] | undefined;
}
