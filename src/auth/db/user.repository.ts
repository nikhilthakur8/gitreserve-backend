import type { User, CreateUserInput } from "@/auth/domain/user.entity.ts";
import type { UserRepositoryPort } from "./user.repository.port.ts";
import { UserModel } from "./user.schema.ts";

function mapDocumentToUser(doc: InstanceType<typeof UserModel>): User {
  return {
    id: doc._id.toString(),
    email: doc.email,
    passwordHash: doc.passwordHash,
    name: doc.name,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class MongoUserRepository implements UserRepositoryPort {
  async create(input: CreateUserInput): Promise<User> {
    const doc = await UserModel.create(input);
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
}
