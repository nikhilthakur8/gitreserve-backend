import { Router, raw } from "express";
import { asyncHandler } from "@/common/async-handler.ts";
import type { SyncController } from "./sync.http.controller.ts";

type ControllerMethod = SyncController["triggerSync" | "getSyncStatus" | "getJob" | "listJobs"];

export function createSyncRouter(controller: SyncController): Router {
  const router = Router();
  const handle = (fn: ControllerMethod) => asyncHandler(fn.bind(controller));

  router.post("/:userId/:repoId/trigger", handle(controller.triggerSync));
  router.get("/:userId/:repoId/status", handle(controller.getSyncStatus));
  router.get("/:userId/jobs", handle(controller.listJobs));
  router.get("/jobs/:jobId", handle(controller.getJob));

  router.post(
    "/webhooks/github/:repoId",
    raw({ type: "application/json" }),
    controller.handleGithubWebhook,
  );
  router.post(
    "/webhooks/gitlab/:repoId",
    raw({ type: "application/json" }),
    controller.handleGitlabWebhook,
  );

  router.use(controller.handleError);

  return router;
}
