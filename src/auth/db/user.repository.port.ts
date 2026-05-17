import type { User, CreateUserInput } from "@/auth/domain/user.entity.ts";

export interface UserRepositoryPort {
  create(input: CreateUserInput): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
}
