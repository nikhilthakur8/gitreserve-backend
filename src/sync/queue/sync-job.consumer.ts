import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  ChangeMessageVisibilityCommand,
} from "@aws-sdk/client-sqs";
import { createChildLogger } from "@/common/logger.ts";
import type { SyncJobPayload, SqsConfig } from "./sync-job.types.ts";
import type { SyncOrchestrator } from "../services/sync-orchestrator.service.ts";
import {
  SQS_DEFAULT_WAIT_TIME,
  SQS_DEFAULT_VISIBILITY_TIMEOUT,
  SQS_POLL_INTERVAL_ON_ERROR,
  SQS_DEFAULT_CONCURRENCY,
} from "../sync.constants.ts";

const logger = createChildLogger("sync-consumer");

export class SyncJobConsumer {
  private readonly client: SQSClient;
  private readonly queueUrl: string;
  private readonly concurrency: number;
  private running = false;
  private activeWorkers = 0;

  constructor(
    config: SqsConfig,
    private readonly orchestrator: SyncOrchestrator,
    private readonly visibilityTimeout = SQS_DEFAULT_VISIBILITY_TIMEOUT,
    concurrency = SQS_DEFAULT_CONCURRENCY,
  ) {
    this.queueUrl = config.queueUrl;
    this.concurrency = concurrency;
    this.client = new SQSClient({
      region: config.region,
      ...(config.endpoint ? { endpoint: config.endpoint } : {}),
    });
  }

  start(): void {
    this.running = true;
    logger.info({ concurrency: this.concurrency }, "SQS sync consumer started");

    for (let i = 0; i < this.concurrency; i++) {
      void this.workerLoop(i);
    }
  }

  private async workerLoop(workerId: number): Promise<void> {
    this.activeWorkers++;

    while (this.running) {
      try {
        const command = new ReceiveMessageCommand({
          QueueUrl: this.queueUrl,
          MaxNumberOfMessages: 1,
          WaitTimeSeconds: SQS_DEFAULT_WAIT_TIME,
          VisibilityTimeout: this.visibilityTimeout,
          MessageAttributeNames: ["All"],
        });

        const response = await this.client.send(command);

        if (!response.Messages?.length) continue;

        for (const message of response.Messages) {
          try {
            await this.process(workerId, message.Body!, message.ReceiptHandle!);
            await this.client.send(
              new DeleteMessageCommand({
                QueueUrl: this.queueUrl,
                ReceiptHandle: message.ReceiptHandle!,
              }),
            );
          } catch {
            // process() already handles retry visibility — just continue polling
          }
        }
      } catch (err) {
        logger.error({ workerId, err }, "Error polling SQS");
        await this.sleep(SQS_POLL_INTERVAL_ON_ERROR);
      }
    }

    this.activeWorkers--;
    logger.info({ workerId, activeWorkers: this.activeWorkers }, "Worker stopped");
  }

  private async process(workerId: number, body: string, receiptHandle: string): Promise<void> {
    const payload = JSON.parse(body) as SyncJobPayload;
    const { jobId, context, trigger, commitSha, commitMessage, commitAuthor } = payload;

    logger.info(
      { workerId, jobId, repo: context.repoFullName, trigger },
      "Processing sync job",
    );

    try {
      await this.orchestrator.execute(jobId, context, trigger, {
        commitSha: commitSha ?? null,
        commitMessage: commitMessage ?? null,
        commitAuthor: commitAuthor ?? null,
      });

      logger.info({ workerId, jobId, repo: context.repoFullName }, "Sync job completed");
    } catch (err) {
      logger.error({ workerId, jobId, repo: context.repoFullName, err }, "Sync job failed");

      await this.client.send(
        new ChangeMessageVisibilityCommand({
          QueueUrl: this.queueUrl,
          ReceiptHandle: receiptHandle,
          VisibilityTimeout: 0,
        }),
      );

      throw err;
    }
  }

  async stop(): Promise<void> {
    this.running = false;
    logger.info("Stopping consumer, waiting for active workers to drain");

    while (this.activeWorkers > 0) {
      await this.sleep(500);
    }

    this.client.destroy();
    logger.info("Consumer stopped");
  }

  getActiveWorkerCount(): number {
    return this.activeWorkers;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
