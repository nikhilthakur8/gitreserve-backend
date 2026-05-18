import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { createChildLogger } from "@/common/logger.ts";
import type { SyncJobPayload, SqsConfig } from "./sync-job.types.ts";

const logger = createChildLogger("sync-publisher");

export class SyncJobPublisher {
  private readonly client: SQSClient;
  private readonly queueUrl: string;

  constructor(config: SqsConfig) {
    this.queueUrl = config.queueUrl;
    this.client = new SQSClient({
      region: config.region,
      ...(config.endpoint ? { endpoint: config.endpoint } : {}),
      ...(config.accessKeyId && config.secretAccessKey
        ? { credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey } }
        : {}),
    });
  }

  async publish(payload: SyncJobPayload): Promise<string> {
    const command = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(payload),
      MessageGroupId: payload.trackedRepoId,
      MessageDeduplicationId: `${payload.trackedRepoId}-${Date.now()}`,
      MessageAttributes: {
        trigger: { DataType: "String", StringValue: payload.trigger },
        provider: { DataType: "String", StringValue: payload.context.providerType },
        repo: { DataType: "String", StringValue: payload.context.repoFullName },
      },
    });

    const result = await this.client.send(command);

    logger.info(
      { messageId: result.MessageId, repo: payload.context.repoFullName, trigger: payload.trigger },
      "Sync job published to SQS",
    );

    return result.MessageId!;
  }

  async close(): Promise<void> {
    this.client.destroy();
  }
}
