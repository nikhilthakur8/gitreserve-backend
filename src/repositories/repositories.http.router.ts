import { Router } from "express";
import { RepositoryController } from "./repositories.http.controller.ts";
import { asyncHandler } from "@/common/async-handler.ts";
import type { RepositoryRepositoryPort } from "./db/repository.repository.port.ts";
import type { IntegrationRepositoryPort } from "@/integrations/db/integration.repository.port.ts";
import type { RepositorySyncService } from "@/sync/services/repository-sync.service.ts";

type ControllerMethod = InstanceType<typeof RepositoryController>[
  "listAvailable" | "track" | "list" | "get" | "update" | "untrack" | "sync"
];

export function createRepositoryRouter(
  repoRepo: RepositoryRepositoryPort,
  integrationRepo: IntegrationRepositoryPort,
  webhookBaseUrl: string,
  syncService: RepositorySyncService,
): Router {
  const router = Router();
  const controller = new RepositoryController(repoRepo, integrationRepo, webhookBaseUrl, syncService);
  const handle = (fn: ControllerMethod) => asyncHandler(fn.bind(controller));

  router.get("/available/:type", handle(controller.listAvailable));
  router.post("/track", handle(controller.track));
  router.get("/", handle(controller.list));
  router.get("/:repoId", handle(controller.get));
  router.patch("/:repoId", handle(controller.update));
  router.delete("/:repoId", handle(controller.untrack));
  router.post("/:repoId/sync", handle(controller.sync));

  router.use(controller.handleError);

  return router;
}
