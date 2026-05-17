import type { IntegrationType } from "@/common/types.ts";

export class IntegrationError extends Error {
  constructor(
    message: string,
    public readonly type: IntegrationType,
    public readonly code: IntegrationErrorCode,
    originalError?: unknown,
  ) {
    super(message, { cause: originalError });
    this.name = "IntegrationError";
  }
}

export type IntegrationErrorCode =
  | "OAUTH_FAILED"
  | "TOKEN_EXPIRED"
  | "TOKEN_REFRESH_FAILED"
  | "INVALID_CREDENTIALS"
  | "INTEGRATION_NOT_FOUND"
  | "ALREADY_CONNECTED"
  | "CONNECTION_TEST_FAILED";
