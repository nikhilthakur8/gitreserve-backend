import { Router } from "express";
import { RepositoryController } from "./repositories.http.controller.ts";
import { asyncHandler } from "@/common/async-handler.ts";
import type { RepositoryRepositoryPort } from "./db/repository.repository.port.ts";
import type { IntegrationRepositoryPort } from "@/integrations/db/integration.repository.port.ts";

type ControllerMethod = InstanceType<typeof RepositoryController>[
  "listAvailable" | "track" | "list" | "get" | "untrack" | "sync"
];

export function createRepositoryRouter(
  repoRepo: RepositoryRepositoryPort,
  integrationRepo: IntegrationRepositoryPort,
  webhookBaseUrl: string,
): Router {
  const router = Router();
  const controller = new RepositoryController(repoRepo, integrationRepo, webhookBaseUrl);
  const handle = (fn: ControllerMethod) => asyncHandler(fn.bind(controller));

  router.get("/:userId/available/:type", handle(controller.listAvailable));
  router.post("/:userId/track", handle(controller.track));
  router.get("/:userId", handle(controller.list));
  router.get("/:userId/:repoId", handle(controller.get));
  router.delete("/:userId/:repoId", handle(controller.untrack));
  router.post("/:userId/:repoId/sync", handle(controller.sync));

  router.use(controller.handleError);

  return router;
}
