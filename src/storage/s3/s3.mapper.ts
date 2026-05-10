import type { DownloadOutput, StorageObject } from "@/storage/storage.types.ts";
import { S3_DEFAULT_CONTENT_TYPE } from "./s3.constants.ts";
import type { S3GetResponse, S3PutResponse } from "./s3.types.ts";

export function mapPutResponseToStorageObject(
  raw: S3PutResponse,
  key: string,
  size: number,
): StorageObject {
  return {
    key,
    size,
    etag: raw.etag ?? "",
  };
}

export function mapGetResponseToDownloadOutput(
  raw: S3GetResponse,
): DownloadOutput {
  if (!raw.body) {
    throw new Error("Empty response body from storage");
  }

  return {
    body: raw.body,
    contentType: raw.contentType ?? S3_DEFAULT_CONTENT_TYPE,
    size: raw.contentLength ?? 0,
  };
}
