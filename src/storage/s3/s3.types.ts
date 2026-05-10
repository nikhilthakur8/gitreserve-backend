import type { Readable } from "node:stream";

export interface S3PutResponse {
  etag: string | undefined;
}

export interface S3GetResponse {
  body: Readable | undefined;
  contentType: string | undefined;
  contentLength: number | undefined;
}

export interface S3HeadResponse {
  contentLength: number | undefined;
  etag: string | undefined;
}
