import type { StorageProvider } from "@/storage/interfaces/storage.interface.ts";
import type { StorageConfig } from "@/storage/storage.types.ts";
import { S3StorageProvider } from "@/storage/s3/s3.provider.ts";

export function createStorageProvider(config: StorageConfig): StorageProvider {
  return new S3StorageProvider(config);
}
