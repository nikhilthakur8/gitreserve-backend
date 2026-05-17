import { Router } from "express";
import { asyncHandler } from "@/common/async-handler.ts";
import type { AppRequest } from "@/common/async-handler.ts";
import type { ApiResponse } from "@/common/api-response.ts";
import { IntegrationController } from "@/integrations/integrations.http.controller.ts";
import type { IntegrationRepositoryPort } from "@/integrations/db/integration.repository.port.ts";

type ControllerMethod = (req: AppRequest) => Promise<ApiResponse>;

export function createIntegrationRouter(repo: IntegrationRepositoryPort): Router {
  const router = Router();
  const controller = new IntegrationController(repo);

  const handle = (fn: ControllerMethod) => asyncHandler(fn.bind(controller));

  router.get("/oauth/:type/url", handle(controller.getOAuthUrl));
  router.post("/:userId/connect/:type", handle(controller.connect));
  router.delete("/:userId/:type", handle(controller.disconnect));
  router.post("/:userId/:type/verify", handle(controller.verify));

  router.use(controller.handleError);

  return router;
}
