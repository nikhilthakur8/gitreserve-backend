import { Router } from "express";
import { asyncHandler } from "@/common/async-handler.ts";
import type { AppRequest } from "@/common/async-handler.ts";
import type { ApiResponse } from "@/common/api-response.ts";
import { AuthController } from "@/auth/auth.http.controller.ts";
import { authMiddleware } from "@/auth/auth.middleware.ts";
import type { AuthService } from "@/auth/services/auth.service.ts";
import type { OAuthService } from "@/auth/services/oauth.service.ts";

type ControllerMethod = (req: AppRequest) => Promise<ApiResponse>;

export function createAuthRouter(authService: AuthService, oauthService: OAuthService): Router {
  const router = Router();
  const controller = new AuthController(authService, oauthService);
  const handle = (fn: ControllerMethod) => asyncHandler(fn.bind(controller));

  router.post("/signup", handle(controller.signup));
  router.post("/login", handle(controller.login));
  router.get("/me", authMiddleware(authService), handle(controller.me));

  router.get("/oauth/:provider/url", handle(controller.getOAuthUrl));
  router.get("/oauth/:provider/callback", controller.handleOAuthCallback.bind(controller));

  router.use(controller.handleError);

  return router;
}
