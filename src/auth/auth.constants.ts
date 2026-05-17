import type { AuthErrorCode } from "@/auth/errors/auth.error.ts";

export const BCRYPT_SALT_ROUNDS = 12;

export const AUTH_ERROR_STATUS_MAP: Record<AuthErrorCode, number> = {
  EMAIL_ALREADY_EXISTS: 409,
  INVALID_CREDENTIALS: 401,
  TOKEN_INVALID: 401,
  TOKEN_EXPIRED: 401,
  USER_NOT_FOUND: 404,
};
