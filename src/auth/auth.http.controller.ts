import type { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/common/api-response.ts";
import type { AppRequest } from "@/common/async-handler.ts";
import type { AuthService } from "@/auth/services/auth.service.ts";
import { signupSchema, loginSchema } from "@/auth/dto/auth.dto.ts";
import { AuthError } from "@/auth/errors/auth.error.ts";
import { AUTH_ERROR_STATUS_MAP } from "@/auth/auth.constants.ts";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

    res.status(500).json({ error: "Internal server error" });
  };
}
