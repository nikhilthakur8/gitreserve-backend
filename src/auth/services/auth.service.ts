import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { UserRepositoryPort } from "@/auth/db/user.repository.port.ts";
import { AuthError } from "@/auth/errors/auth.error.ts";
import { BCRYPT_SALT_ROUNDS } from "@/auth/auth.constants.ts";
import type { SignupDto, LoginDto } from "@/auth/dto/auth.dto.ts";

export interface TokenPayload {
  userId: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
}

export class AuthService {
  constructor(
    private readonly userRepo: UserRepositoryPort,
    private readonly jwtSecret: string,
    private readonly jwtExpiresIn: number = 86400,
  ) {}

  async signup(dto: SignupDto): Promise<AuthTokens> {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) {
      throw new AuthError("Email already registered", "EMAIL_ALREADY_EXISTS");
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    const user = await this.userRepo.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      name: dto.name,
    });

    return this.generateTokens(user.id, user.email);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) {
      throw new AuthError("Invalid email or password", "INVALID_CREDENTIALS");
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new AuthError("Invalid email or password", "INVALID_CREDENTIALS");
    }

    return this.generateTokens(user.id, user.email);
  }

  async me(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AuthError("User not found", "USER_NOT_FOUND");
    }
    return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
  }

  verifyToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as TokenPayload;
      return payload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new AuthError("Token expired", "TOKEN_EXPIRED");
      }
      throw new AuthError("Invalid token", "TOKEN_INVALID");
    }
  }

  private generateTokens(userId: string, email: string): AuthTokens {
    const accessToken = jwt.sign({ userId, email } satisfies TokenPayload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
    });
    return { accessToken, expiresIn: this.jwtExpiresIn };
  }
}
