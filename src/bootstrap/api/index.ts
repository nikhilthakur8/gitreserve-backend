import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import mongoose from "mongoose";
import { pinoHttp } from "pino-http";

import { createChildLogger } from "@/common/logger.ts";
import { MongoIntegrationRepository } from "@/integrations/db/integration.repository.ts";
import { createIntegrationRouter } from "@/integrations/integrations.http.router.ts";
import { MongoRepositoryRepository } from "@/repositories/db/repository.repository.ts";
import { createRepositoryRouter } from "@/repositories/repositories.http.router.ts";
import { SyncJobPublisher } from "@/sync/queue/sync-job.publisher.ts";
import { MongoSyncJobRepository } from "@/sync/db/sync-job.repository.ts";
import { RepositorySyncService } from "@/sync/services/repository-sync.service.ts";
import { GithubWebhookHandler } from "@/sync/webhooks/github-webhook.handler.ts";
import { GitlabWebhookHandler } from "@/sync/webhooks/gitlab-webhook.handler.ts";
import { SyncController } from "@/sync/sync.http.controller.ts";
import { createSyncRouter } from "@/sync/sync.http.router.ts";

const logger = createChildLogger("api-bootstrap");

async function main() {
  const mongoUrl = process.env["MONGO_URL"] ?? "mongodb://localhost:27017/gitreserve";
  const port = parseInt(process.env["PORT"] ?? "3000", 10);
  const webhookBaseUrl = process.env["WEBHOOK_BASE_URL"] ?? `http://localhost:${port}`;

  // Database
  await mongoose.connect(mongoUrl);
  logger.info("Connected to MongoDB");

  // Repositories
  const integrationRepo = new MongoIntegrationRepository();
  const repoRepo = new MongoRepositoryRepository();
  const syncJobRepo = new MongoSyncJobRepository();

  // SQS Publisher
  const sqsConfig = {
    queueUrl: process.env["SQS_QUEUE_URL"] ?? "",
    region: process.env["AWS_REGION"] ?? "us-east-1",
    ...(process.env["SQS_ENDPOINT"] ? { endpoint: process.env["SQS_ENDPOINT"] } : {}),
  };
  const publisher = new SyncJobPublisher(sqsConfig);

  // Services
  const syncService = new RepositorySyncService(repoRepo, integrationRepo, syncJobRepo, publisher);
  const githubWebhook = new GithubWebhookHandler(repoRepo, integrationRepo, syncJobRepo, publisher);
  const gitlabWebhook = new GitlabWebhookHandler(repoRepo, integrationRepo, syncJobRepo, publisher);
  const syncController = new SyncController(syncService, repoRepo, githubWebhook, gitlabWebhook);

  // Express
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(compression());
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(pinoHttp({ logger: createChildLogger("http") }));

  // Health
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // Routes
  app.use("/api/v1/integrations", createIntegrationRouter(integrationRepo));
  app.use("/api/v1/repositories", createRepositoryRouter(repoRepo, integrationRepo, webhookBaseUrl));
  app.use("/api/v1/sync", createSyncRouter(syncController));

  // Start
  const server = app.listen(port, () => {
    logger.info({ port }, "API server started");
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutdown signal received");
    server.close();
    await publisher.close();
    await mongoose.disconnect();
    logger.info("API server stopped");
    process.exit(0);
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((err) => {
  logger.error({ err }, "Failed to start API server");
  process.exit(1);
});
