export type AuthErrorCode =
  | "EMAIL_ALREADY_EXISTS"
  | "INVALID_CREDENTIALS"
  | "TOKEN_INVALID"
  | "TOKEN_EXPIRED"
  | "USER_NOT_FOUND";

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: AuthErrorCode,
  ) {
    super(message);
    this.name = "AuthError";
  }
}
