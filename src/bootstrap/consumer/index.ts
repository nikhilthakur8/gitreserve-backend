import "dotenv/config";

import mongoose from "mongoose";

import { createChildLogger } from "@/common/logger.ts";
import { MongoIntegrationRepository } from "@/integrations/db/integration.repository.ts";
import { MongoRepositoryRepository } from "@/repositories/db/repository.repository.ts";
import { MongoSyncJobRepository } from "@/sync/db/sync-job.repository.ts";
import { SyncStatusService } from "@/sync/services/sync-status.service.ts";
import { SyncMetadataService } from "@/sync/services/sync-metadata.service.ts";
import { SyncOrchestrator } from "@/sync/services/sync-orchestrator.service.ts";
import { SyncJobConsumer } from "@/sync/queue/sync-job.consumer.ts";
import type { SqsConfig } from "@/sync/queue/sync-job.types.ts";
import { SQS_DEFAULT_CONCURRENCY } from "@/sync/sync.constants.ts";

const logger = createChildLogger("consumer-bootstrap");

async function main() {
  const mongoUrl = process.env["MONGO_URL"] ?? "mongodb://localhost:27017/gitreserve";

  // Database
  await mongoose.connect(mongoUrl);
  logger.info("Connected to MongoDB");

  // Repositories
  const integrationRepo = new MongoIntegrationRepository();
  const repoRepo = new MongoRepositoryRepository();
  const syncJobRepo = new MongoSyncJobRepository();

  // Services
  const statusService = new SyncStatusService(repoRepo);
  const metadataService = new SyncMetadataService(repoRepo);
  const orchestrator = new SyncOrchestrator(integrationRepo, syncJobRepo, metadataService, statusService);

  // SQS Consumer
  const sqsConfig: SqsConfig = {
    queueUrl: process.env["SQS_QUEUE_URL"] ?? "",
    region: process.env["AWS_REGION"] ?? "us-east-1",
    ...(process.env["SQS_ENDPOINT"] ? { endpoint: process.env["SQS_ENDPOINT"] } : {}),
  };
  const concurrency = parseInt(process.env["CONSUMER_CONCURRENCY"] ?? String(SQS_DEFAULT_CONCURRENCY), 10);
  const consumer = new SyncJobConsumer(sqsConfig, orchestrator, undefined, concurrency);

  consumer.start();
  logger.info({ concurrency }, "Sync consumer started");

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutdown signal received");
    await consumer.stop();
    await mongoose.disconnect();
    logger.info("Consumer stopped");
    process.exit(0);
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((err) => {
  logger.error({ err }, "Failed to start consumer");
  process.exit(1);
});
