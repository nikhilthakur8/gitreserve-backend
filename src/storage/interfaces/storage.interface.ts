import type {
  DownloadOutput,
  StorageObject,
  UploadInput,
} from "@/storage/storage.types.ts";

export interface StorageProvider {
  upload(input: UploadInput): Promise<StorageObject>;
  download(key: string): Promise<DownloadOutput>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
