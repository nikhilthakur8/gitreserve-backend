import type { User, CreateUserInput, OAuthProvider } from "@/auth/domain/user.entity.ts";
import type { UserRepositoryPort } from "./user.repository.port.ts";
import { UserModel } from "./user.schema.ts";

function mapDocumentToUser(doc: InstanceType<typeof UserModel>): User {
  return {
    id: doc._id.toString(),
    email: doc.email,
    passwordHash: doc.passwordHash ?? null,
    name: doc.name,
    avatarUrl: doc.avatarUrl ?? undefined,
    oauthAccounts: (doc.oauthAccounts ?? []).map((a) => ({
      provider: a.provider as OAuthProvider,
      providerId: a.providerId,
      email: a.email,
      avatarUrl: a.avatarUrl ?? undefined,
    })),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class MongoUserRepository implements UserRepositoryPort {
  async create(input: CreateUserInput): Promise<User> {
    const data: Record<string, unknown> = {
      email: input.email,
      passwordHash: input.passwordHash,
      name: input.name,
      oauthAccounts: input.oauthAccounts ?? [],
    };
    if (input.avatarUrl) data["avatarUrl"] = input.avatarUrl;
    const doc = await UserModel.create(data);
    return mapDocumentToUser(doc);
  }

  async findById(id: string): Promise<User | null> {
    const doc = await UserModel.findById(id);
    return doc ? mapDocumentToUser(doc) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await UserModel.findOne({ email: email.toLowerCase() });
    return doc ? mapDocumentToUser(doc) : null;
  }

  async findByOAuthProvider(provider: OAuthProvider, providerId: string): Promise<User | null> {
    const doc = await UserModel.findOne({
      "oauthAccounts.provider": provider,
      "oauthAccounts.providerId": providerId,
    });
    return doc ? mapDocumentToUser(doc) : null;
  }

  async linkOAuthAccount(
    userId: string,
    account: { provider: OAuthProvider; providerId: string; email: string; avatarUrl?: string },
  ): Promise<User | null> {
    const doc = await UserModel.findByIdAndUpdate(
      userId,
      { $push: { oauthAccounts: account } },
      { new: true },
    );
    return doc ? mapDocumentToUser(doc) : null;
  }
}
