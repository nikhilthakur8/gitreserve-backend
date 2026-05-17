import { Router } from "express";
import { asyncHandler } from "@/common/async-handler.ts";
import type { SyncController } from "./sync.http.controller.ts";

type ControllerMethod = SyncController["triggerSync" | "getSyncStatus" | "getJob" | "listJobs"];

export function createSyncRouter(controller: SyncController): Router {
  const router = Router();
  const handle = (fn: ControllerMethod) => asyncHandler(fn.bind(controller));

  router.post("/:repoId/trigger", handle(controller.triggerSync));
  router.get("/:repoId/status", handle(controller.getSyncStatus));
  router.get("/jobs", handle(controller.listJobs));
  router.get("/jobs/:jobId", handle(controller.getJob));

  router.use(controller.handleError);

  return router;
}
