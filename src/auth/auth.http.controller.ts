import type { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/common/api-response.ts";
import type { AppRequest } from "@/common/async-handler.ts";
import type { AuthService } from "@/auth/services/auth.service.ts";
import type { OAuthService } from "@/auth/services/oauth.service.ts";
import type { OAuthProvider } from "@/auth/domain/user.entity.ts";
import { signupSchema, loginSchema } from "@/auth/dto/auth.dto.ts";
import { AuthError } from "@/auth/errors/auth.error.ts";
import { AUTH_ERROR_STATUS_MAP } from "@/auth/auth.constants.ts";

const VALID_OAUTH_PROVIDERS = new Set<string>(["github", "google"]);

export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly oauthService: OAuthService,
  ) {}

  async signup(req: AppRequest) {
    const dto = signupSchema.parse(req.body);
    const tokens = await this.authService.signup(dto);
    return ApiResponse.created(tokens);
  }

  async login(req: AppRequest) {
    const dto = loginSchema.parse(req.body);
    const tokens = await this.authService.login(dto);
    return ApiResponse.ok(tokens);
  }

  async me(req: AppRequest) {
    const userId = req.userId;
    if (!userId) {
      throw new AuthError("Invalid token", "TOKEN_INVALID");
    }
    const user = await this.authService.me(userId);
    return ApiResponse.ok(user);
  }

  async getOAuthUrl(req: AppRequest) {
    const { provider } = req.params;
    if (!provider || !VALID_OAUTH_PROVIDERS.has(provider)) {
      throw new AuthError("Invalid OAuth provider", "INVALID_CREDENTIALS");
    }
    const state = crypto.randomUUID();
    const url = this.oauthService.getAuthorizationUrl(provider as OAuthProvider, state);
    return ApiResponse.ok({ url, state });
  }

  async handleOAuthCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const provider = String(req.params["provider"] ?? "");
      if (!provider || !VALID_OAUTH_PROVIDERS.has(provider)) {
        throw new AuthError("Invalid OAuth provider", "INVALID_CREDENTIALS");
      }

      const code = String(req.query["code"] ?? "");
      if (!code) {
        throw new AuthError("Missing authorization code", "INVALID_CREDENTIALS");
      }

      const { redirectUrl } = await this.oauthService.handleCallback(
        provider as OAuthProvider,
        code,
      );

      res.redirect(redirectUrl);
    } catch (err) {
      next(err);
    }
  }

  handleError = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
    if (err instanceof AuthError) {
      res.status(AUTH_ERROR_STATUS_MAP[err.code] ?? 500).json({
        error: err.message,
        code: err.code,
      });
      return;
    }

    if (err.name === "ZodError") {
      res.status(400).json({ error: "Validation failed", details: err });
      return;
    }

    res.status(500).json({ error: err.message || "Internal server error" });
  };
}
