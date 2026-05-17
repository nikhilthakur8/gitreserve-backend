import { Router, raw } from "express";
import type { WebhookController } from "./webhook.http.controller.ts";

export function createWebhookRouter(controller: WebhookController): Router {
  const router = Router();

  router.post("/github/:repoId", raw({ type: "application/json" }), controller.handleGithub);
  router.post("/gitlab/:repoId", raw({ type: "application/json" }), controller.handleGitlab);

  return router;
}
