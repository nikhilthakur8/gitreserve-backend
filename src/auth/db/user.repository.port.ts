import type { User, CreateUserInput, OAuthProvider } from "@/auth/domain/user.entity.ts";

export interface UserRepositoryPort {
  create(input: CreateUserInput): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByOAuthProvider(provider: OAuthProvider, providerId: string): Promise<User | null>;
  linkOAuthAccount(userId: string, account: { provider: OAuthProvider; providerId: string; email: string; avatarUrl?: string | undefined }): Promise<User | null>;
}
