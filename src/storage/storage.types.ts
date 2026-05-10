import type { Readable } from "node:stream";
import type { StorageType } from "@/common/types.ts";

export type { StorageType };

export interface StorageConfig {
  type: StorageType;
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

export interface StorageObject {
  key: string;
  size: number;
  etag: string;
}

export interface UploadInput {
  key: string;
  body: Readable | Buffer;
  contentType: string;
}

export interface DownloadOutput {
  body: Readable;
  contentType: string;
  size: number;
}
