import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { StorageOperation } from "@/common/types.ts";
import type { StorageProvider } from "@/storage/interfaces/storage.interface.ts";
import { StorageError } from "@/storage/errors/storage.error.ts";
import type {
  DownloadOutput,
  StorageConfig,
  StorageObject,
  UploadInput,
} from "@/storage/storage.types.ts";
import {
  mapGetResponseToDownloadOutput,
  mapPutResponseToStorageObject,
} from "./s3.mapper.ts";
import type { S3GetResponse, S3PutResponse } from "./s3.types.ts";

export class S3StorageProvider implements StorageProvider {
  readonly providerName = "s3";
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: StorageConfig) {
    this.bucket = config.bucket;
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  async upload(input: UploadInput): Promise<StorageObject> {
    return this.execute("upload", input.key, async () => {
      const response = await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: input.key,
          Body: input.body,
          ContentType: input.contentType,
        }),
      );

      const raw: S3PutResponse = { etag: response.ETag };
      const size = Buffer.isBuffer(input.body) ? input.body.length : 0;
      return mapPutResponseToStorageObject(raw, input.key, size);
    });
  }

  async download(key: string): Promise<DownloadOutput> {
    return this.execute("download", key, async () => {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      const raw: S3GetResponse = {
        body: response.Body as S3GetResponse["body"],
        contentType: response.ContentType,
        contentLength: response.ContentLength,
      };
      return mapGetResponseToDownloadOutput(raw);
    });
  }

  async delete(key: string): Promise<void> {
    return this.execute("delete", key, async () => {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
    });
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }

  private async execute<T>(
    operation: StorageOperation,
    key: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError(
        `Failed to ${operation}: ${key}`,
        key,
        operation,
        error,
      );
    }
  }
}
